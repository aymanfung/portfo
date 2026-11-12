import { useEffect, useRef, type RefObject } from "react"
import { clamp } from "./keyCardRules"

/* ══ Swing: the card hangs from where it is held ══════════════════
   Grab the card and it is held at one point (where you pressed), and the rest of it swings about that point like something hung from a
   finger: move sideways and it trails behind, tilting; stop and it rocks back and settles upright.
   A spring-and-damper on the angle, pulled toward a target that depends on how fast the pointer is moving sideways. The card's
   `transform-origin` is set to the grab point, so that point stays exactly under the pointer while the rest turns about it. */

/** Degrees of tilt per plate-unit-per-second of sideways speed, before the lever (below) and the limit. */
const TILT_PER_SPEED = 0.045
/** The most it tilts, in degrees. */
const MAX_TILT = 38
/** Spring stiffness and damping: low damping so it overshoots and rocks a few times before it settles. */
const STIFFNESS = 62 // one rock takes about 0.8s (it was 0.45s: stiffer, so quicker)
const DAMPING = 3.8 // kept in proportion to the stiffness, so it rocks the same number of times, just more slowly

export type Swing = { theta: number; omega: number; px: number; py: number }

export function useCardSwing(card: RefObject<HTMLDivElement | null>) {
  const s = useRef<(Swing & { raf: number; last: number; half: number; speed: () => number; scale: () => number; still: boolean }) | null>(null)

  useEffect(() => () => { if (s.current) cancelAnimationFrame(s.current.raf) }, [])

  /** Start swinging from the grab point (px, py: where on the card, in plate units, from its top-left). `speed` is the pointer's current
   *  sideways speed in plate units per second. */
  const start = (px: number, py: number, h: number, speed: () => number) => {
    const el = card.current
    if (!el) return
    stop()
    el.style.transformOrigin = `${px.toFixed(1)}px ${py.toFixed(1)}px`
    // grabbed above the middle it hangs below the grip and trails the motion; grabbed below the middle it would balance on it and lean the
    // other way. Held right at the middle there is nothing to swing about, so it barely tilts.
    const lever = clamp((h / 2 - py) / (h / 2), -1, 1)
    const st = { theta: 0, omega: 0, px, py, raf: 0, last: performance.now(), half: lever, speed, scale: () => 1, still: false }
    s.current = st
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - st.last) / 1000)
      st.last = now
      if (st.still) {
        // In (or going into) the slot the card is guided by the slot: no swinging, it straightens up fast and stays upright.
        st.omega = 0
        st.theta *= Math.exp(-dt * 30)
        if (Math.abs(st.theta) < 0.05) st.theta = 0
        el.style.setProperty("--r", `${st.theta.toFixed(2)}deg`)
        st.raf = requestAnimationFrame(step)
        return
      }
      const target = clamp(st.speed() * TILT_PER_SPEED * st.half, -MAX_TILT, MAX_TILT)
      st.omega += (STIFFNESS * (target - st.theta) - DAMPING * st.omega) * dt
      st.theta += st.omega * dt
      el.style.setProperty("--r", `${st.theta.toFixed(2)}deg`)
      st.raf = requestAnimationFrame(step)
    }
    st.raf = requestAnimationFrame(step)
  }

  /** While true the card does not swing: it straightens up and stays upright (used while it is going into the slot). */
  const hold = (still: boolean) => { if (s.current) s.current.still = still }

  /** Stop swinging; returns where the swing had got to (null if it was not running). */
  const stop = (): Swing | null => {
    const st = s.current
    if (!st) return null
    cancelAnimationFrame(st.raf)
    s.current = null
    return { theta: st.theta, omega: st.omega, px: st.px, py: st.py }
  }

  /** Put the card's turning point back at its middle. */
  const resetOrigin = () => { card.current?.style.removeProperty("transform-origin") }

  return { start, stop, hold, resetOrigin }
}
