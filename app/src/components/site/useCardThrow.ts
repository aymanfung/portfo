import { useEffect, useRef, useState, type RefObject } from "react"
import { flushSync } from "react-dom"
import { FACES } from "./cards/faces"
import { CARD_H, clamp } from "./keyCardRules"
import { playSound } from "@/lib/sfx"

/** Gravity, in screen pixels per second squared (converted to plate units for the scale it is shown at). */
const FALL_G = 1200
/** How long the new card takes to appear again, once the old one has fallen out of sight. */
const RESPAWN_MS = 480
/** The card is held this far in front of the plate, in plate units, even when not turned, while it falls (plus the swing of its back edge). */
const CARD_LIFT = 6
/** The left and right edges of the screen are walls: how much sideways speed a card keeps when it hits one, and how much of its spin. */
const WALL_BOUNCE = 0 // it stops dead against the wall and drops straight down, rather than springing off and carrying on across the screen
const WALL_SPIN_KEEP = 0.25
/** The wall only makes a sound when the card hits it this hard (sideways speed in screen px/s); a soft touch is silent. */
const WALL_SOUND_MIN = 450
const STYLE_VARS = ["--y", "--x", "--r", "--fx", "--lz"]

/** A card index different from `prev`: every card that is dropped is replaced by another one. */
const nextFace = (prev: number) => {
  let n = prev
  while (n === prev) n = Math.floor(Math.random() * FACES.length)
  return n
}

/**
 * Dropping the card: it falls with gravity off the screen, tumbling and flipping (the card's CSS variables are written every frame), and
 * then a new, different card appears at the resting place for the room's current mode.
 *
 * Owns the state of that: `falling`, `respawning` and which card (`face`) is in use. `onStart` / `onEnd` let the switch lock itself
 * while the card is away and open again when the new one is in.
 */
export function useCardThrow(
  card: RefObject<HTMLDivElement | null>,
  hooks: { onStart: () => void; onEnd: () => void },
  /** `limit`: how many cards can be thrown away before none are left (unset: endless). `onEmpty` is called once the last one has gone. */
  opts: { limit?: number; onEmpty?: () => void } = {},
) {
  const [face, setFace] = useState(0) // 0 is the hotel key
  const [falling, setFalling] = useState(false)
  const [respawning, setRespawning] = useState(false)
  const [used, setUsed] = useState(0) // how many cards have been thrown away
  const usedRef = useRef(0) // read straight away when a card lands (state is only for drawing)
  const fallingRef = useRef(false)
  const raf = useRef(0)
  const respawnTimer = useRef<number | undefined>(undefined)
  const latest = useRef(hooks)
  latest.current = hooks
  const limitRef = useRef(opts)
  limitRef.current = opts

  // The card pictures are fetched ahead of time, so a card that turns up is drawn whole, not a moment after.
  useEffect(() => {
    ["/cards/critter-front.webp", "/cards/critter-back.png"].forEach((src) => { new Image().src = src })
  }, [])

  useEffect(() => () => {
    window.clearTimeout(respawnTimer.current)
    cancelAnimationFrame(raf.current)
  }, [])

  /** Drop the card from where it is (x0, y0 in plate units) with the pointer's speed at that moment (screen px per second). */
  const throwAway = (x0: number, y0: number, vxScreen: number, vyScreen: number, spin0?: number) => {
    const el = card.current
    if (!el) return
    latest.current.onStart()
    const finish = () => {
      fallingRef.current = false
      cancelAnimationFrame(raf.current)
      usedRef.current += 1
      const { limit, onEmpty } = limitRef.current
      const last = limit !== undefined && usedRef.current >= limit // that was the last card: nothing turns up to replace it
      // The new card must be in the page BEFORE the old one's fall styles are taken off: finishing runs inside an animation frame, and
      // without flushSync React draws the update a moment later, so for one frame the old card showed again at its resting place.
      // Rendered first (the card is still down off the screen), then the styles go: the new card is what appears.
      flushSync(() => {
        setFalling(false)
        setUsed(usedRef.current)
        if (!last) {
          setFace(nextFace)
          setRespawning(true) // the new card pops in at its rest place (see [data-respawn] in the CSS)
        }
      })
      STYLE_VARS.forEach((v) => el.style.removeProperty(v))
      latest.current.onEnd()
      if (last) {
        onEmpty?.()
        return
      }
      window.clearTimeout(respawnTimer.current)
      respawnTimer.current = window.setTimeout(() => setRespawning(false), RESPAWN_MS)
      // The room stays in whatever mode it is on (a dropped card is always out of the slot, so that is dark): the new card simply
      // appears at the resting place for that mode. It is not put back into the slot.
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish() // no tumbling for people who asked for less motion: it just comes back
      return
    }
    fallingRef.current = true
    setFalling(true)
    const k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hk-s")) || 1
    const g = FALL_G / k
    let x = x0
    let y = y0
    let vx = vxScreen / k
    let vy = vyScreen / k
    let rot = parseFloat(el.style.getPropertyValue("--r")) || 0
    let flip = 0
    // degrees per second, round and round: carried on from the swing if the card was swinging, else a random turn
    let spin = spin0 !== undefined && Math.abs(spin0) > 80 ? clamp(spin0, -600, 600) : (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 220)
    const flipRate = 380 + Math.random() * 320 // and end over end, so it turns to show its back
    const start = performance.now()
    let last = start
    let wallHit = false // the wall sound plays on the first impact only: the card then hugs the wall and keeps grazing it as it drops
    const step = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000)
      last = now
      vy += g * dt
      x += vx * dt
      y += vy * dt
      rot += spin * dt
      flip += flipRate * dt
      el.style.setProperty("--x", x.toFixed(1))
      el.style.setProperty("--y", y.toFixed(1))
      el.style.setProperty("--r", `${rot.toFixed(1)}deg`)
      el.style.setProperty("--fx", `${flip.toFixed(1)}deg`)
      // A card turning end over end swings half of itself BEHIND its own centre plane, and the plate sits just behind that plane, so
      // the plate would cut the turning card. Push the card toward the viewer by exactly as much as its back edge swings back (half its
      // height times how far it is turned), plus a little: it then passes in front of the plate at every angle, with no jump at the start.
      el.style.setProperty("--lz", `${(CARD_LIFT + (CARD_H / 2) * Math.abs(Math.sin((flip * Math.PI) / 180))).toFixed(1)}px`)
      let b = el.getBoundingClientRect()
      // The sides of the screen are walls: a card that reaches one is pushed back inside and stops against it (keeping almost none of its
      // sideways speed, and little spin), so it drops down the wall. It only leaves the screen through the bottom.
      // The card's width at the wall is worked out from its turn in the plane (not the end-over-end flip, which the browser's box for it
      // would blow up with perspective): its centre, and the half-width of the turned rectangle.
      const a = (rot * Math.PI) / 180
      const cx = (b.left + b.right) / 2
      const halfW = (((66 / 2) * Math.abs(Math.cos(a)) + (CARD_H / 2) * Math.abs(Math.sin(a))) * k)
      const over = cx - halfW < 0 ? halfW - cx : cx + halfW > window.innerWidth ? window.innerWidth - (cx + halfW) : 0
      if (over !== 0) {
        const force = Math.abs(vx) * k // sideways speed at impact, in screen px/s
        if (!wallHit && force > WALL_SOUND_MIN) {
          wallHit = true
          playSound("ui-audio/click3", clamp(0.25 + (force - WALL_SOUND_MIN) / 2400, 0.25, 0.8)) // a harder hit is louder
        }
        x += over / k
        vx = (over > 0 ? Math.abs(vx) : -Math.abs(vx)) * WALL_BOUNCE
        spin = -spin * WALL_SPIN_KEEP
        el.style.setProperty("--x", x.toFixed(1))
        b = el.getBoundingClientRect()
      }
      const gone = b.top > window.innerHeight + 60
      if (gone || now - start > 6000) finish()
      else raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  /** A new set of cards (the hotel key first) turns up at the resting place. */
  const restock = () => {
    // a card still on its way down is cancelled, so it cannot be counted as lost after the new set is back
    cancelAnimationFrame(raf.current)
    if (fallingRef.current) {
      card.current && STYLE_VARS.forEach((v) => card.current!.style.removeProperty(v))
      fallingRef.current = false
      setFalling(false)
      latest.current.onEnd()
    }
    usedRef.current = 0
    setUsed(0)
    setFace(0)
    setRespawning(true)
    window.clearTimeout(respawnTimer.current)
    respawnTimer.current = window.setTimeout(() => setRespawning(false), RESPAWN_MS)
  }

  const empty = opts.limit !== undefined && used >= opts.limit
  return { face, falling, respawning, throwAway, empty, remaining: opts.limit === undefined ? Infinity : Math.max(0, opts.limit - used), restock }
}
