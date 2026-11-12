import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { useParallax, useStageFit, useThemeSwitch } from "@/hooks/use-theme-switch"
import "./hotel-key-toggle.css"
import { CardBack, CardFace, FACES } from "./cards/faces"
import {
  CARD_IN, CARD_OUT, CLIP_TOP, DRAG_Y, STAGE_VARS, TAP_SLOP,
  clamp, constrainDrag, goingIn, inSlot, isThrownAway, startFlags, type DragFlags,
} from "./keyCardRules"
import { useCardSwing } from "./useCardSwing"
import { useCardThrow } from "./useCardThrow"
import { useFadePress } from "./useFadePress"

/** The switch is laid out in a box 420px wide in its own design units; everything is scaled from that. */
const DESIGN_W = 420
/** Side space kept clear of the screen edge, per side, on a phone. */
const GUTTER = 16
/** How big it may get: nearly the full width of a phone; on a larger screen it is allowed to be bigger still. */
const maxScale = (vw: number) => (vw < 600 ? 0.9 : 1.2)
const PARALLAX = { ry: 8, rx0: 0, rx: 6 }
/** After letting go off to the side, how long the card stays unclipped while it swings back to the slot. */
const CLIP_RETURN_MS = 350
/** How long after the card moves the room's power actually changes, like the real thing. */
const POWER_ON_DELAY = 420
const POWER_OFF_DELAY = 260

/**
 * The hotel-room power switch: slot the key card in and the lights come on (light mode); pull it out and the
 * power cuts (dark mode). Two ways to work it: click or tap anywhere on the plate (it is one button, so keyboard and
 * screen readers work too), or take hold of the card and drag it. Dragging has to be lined up with the slot to go in,
 * and the slot glows when it is; miss and the card springs back. The card moves first, the room follows a beat later.
 * Drag the card right off the plate and let go and it is dropped: it falls off the screen, tumbling and flipping, and a new one
 * appears at its resting place for whatever mode the room is in (dark: out of the slot).
 */
export function HotelKeyToggle({ maxCards, onOutOfCards, onCardsLeft, restockToken = 0 }: {
  /** A limited supply: this many cards can be thrown away, and then there are none left (unset: a new one always turns up). */
  maxCards?: number
  /** Called once the last card has fallen away. */
  onOutOfCards?: () => void
  /** Called with how many cards are left, whenever that changes. */
  onCardsLeft?: (left: number) => void
  /** Change this number to put a fresh set of cards back. */
  restockToken?: number
} = {}) {
  const { dark, setTheme } = useThemeSwitch()
  const [inserted, setInserted] = useState(!dark)
  const insertedRef = useRef(inserted) // always the latest in/out state; pointer events can arrive several times between renders
  insertedRef.current = inserted
  const busy = useRef(false)
  /** Set while the card has been moved but the room's power has not yet followed (the short delay in setCard): the card may be grabbed again then. */
  const pendingPower = useRef<boolean | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const sceneRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const plateRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null) // the card (with its slot clip), kept live while the page fades (see onCardMove)
  const drag = useRef<DragFlags & {
    id: number; x0: number; y0: number; yStart: number; moved: boolean
    vx: number; vy: number; lx: number; ly: number; t: number // how fast the pointer is moving (a card let go mid-flick is thrown that way)
  } | null>(null)
  const suppressClick = useRef(false) // the click that follows the end of a drag must not also flip the switch
  const [dragging, setDragging] = useState(false)
  // The card is only hidden below the slot line (see .hk-clip) when it is lined up with the slot, i.e. actually going in. Held off
  // to the side it is NOT in the slot, so it must stay fully visible over the plate: `open` turns the clip off for that.
  const [open, setOpen] = useState(false)
  const openTimer = useRef<number | undefined>(undefined)
  // Thrown away: the card falls off the screen and a different one appears (which card, and whether it is falling or arriving, is in here).
  const swing = useCardSwing(cardRef)
  const originTimer = useRef<number | undefined>(undefined) // puts the card's turning point back to its middle once it has swung back upright
  const { face, falling, respawning, throwAway, empty, remaining, restock } = useCardThrow(cardRef, {
    onStart: () => {
      busy.current = true // nothing else can be done with the switch until the new card is back
      window.clearTimeout(openTimer.current)
      setOpen(true) // the slot's clip must not hide any of it
    },
    onEnd: () => {
      setOpen(false) // the clip is back at once: a card coming back into the slot must not show below the slot line
      busy.current = false
    },
  }, { limit: maxCards, onEmpty: onOutOfCards })
  const emptyRef = useRef(empty)
  emptyRef.current = empty
  useEffect(() => { if (maxCards !== undefined) onCardsLeft?.(remaining) }, [remaining]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (restockToken > 0) restock() }, [restockToken]) // eslint-disable-line react-hooks/exhaustive-deps
  // While the card is held, the whole page shows the closed hand: the card lags and swings under the pointer, so a cursor taken from
  // whatever is under it would flicker between hand shapes.
  useEffect(() => {
    if (!dragging) return
    document.documentElement.setAttribute("data-hk-grabbing", "")
    return () => document.documentElement.removeAttribute("data-hk-grabbing")
  }, [dragging])
  useStageFit(DESIGN_W, 1, "--hk-s", GUTTER * 2, maxScale)
  useParallax(sceneRef, PARALLAX)

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    window.clearTimeout(openTimer.current)
    window.clearTimeout(originTimer.current)
  }, [])

  // If another toggle on the page changes the theme, the card follows it (unless this switch is mid-flip).
  useEffect(() => {
    if (!busy.current && !drag.current) setInserted(!dark)
  }, [dark])

  /** Put the card in or take it out. */
  const setCard = (next: boolean) => {
    // Can be changed again at any moment, mid-slide or while the room is still fading: the card turns round from wherever it is (a CSS
    // transition reverses smoothly) and the power change that was waiting is replaced by the new one. Only a thrown card, falling, refuses.
    if (falling || emptyRef.current || next === insertedRef.current) return
    window.clearTimeout(timer.current)
    busy.current = true
    pendingPower.current = next
    insertedRef.current = next
    setInserted(next) // the card moves now…
    timer.current = window.setTimeout(() => {
      pendingPower.current = null
      // …and the room's power follows. The card is kept out of the page's cross-fade (keepLive): otherwise the fade takes a picture of the
      // page with the card still part-way along its slide, and that ghost of the card, at the wrong height, fades out beside the real one.
      if (document.documentElement.classList.contains("dark") !== !next) setTheme(!next, undefined, { keepLive: clipRef.current })
      timer.current = window.setTimeout(() => { busy.current = false }, 500)
    }, next ? POWER_ON_DELAY : POWER_OFF_DELAY)
  }
  const toggle = () => setCard(!insertedRef.current) // the ref, not the state: clicks can arrive faster than React renders

  // ── dragging the card ───────────────────────────────────────────────────────────────────────────────────────────
  // While it is held, the card's position is written straight to its CSS variables (no React render per pixel). On
  // release they are cleared, so it eases to wherever the switch now says it belongs.
  const onCardDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || emptyRef.current) return
    if (busy.current) {
      // Not grabbable only while a thrown card falls / a new one appears. Right after a release the card may be picked up again:
      // the power change that was waiting is applied now, so the drag starts from a settled state.
      if (falling) return // a thrown card is still on its way down
      window.clearTimeout(timer.current)
      if (pendingPower.current !== null) { setTheme(!pendingPower.current); pendingPower.current = null }
      busy.current = false
    }
    try { cardRef.current?.setPointerCapture(e.pointerId) } catch { /* not an active pointer (synthetic event) */ }
    window.clearTimeout(openTimer.current)
    // a slotted-in card starts out locked in the slot: it can only go up and down until it is clear of it
    // a card that starts out above the slot is already "armed": a fast flick straight down can jump the slot line in one step
    // Grabbed mid-way (while it is still easing to its resting place after a release) it is picked up exactly where it is on the
    // screen, not where it is going: read its actual position from its transform, and carry on from there.
    const k0 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hk-s")) || 1
    let yStart = inserted ? CARD_IN : CARD_OUT
    let xStart = 0
    try {
      const m = new DOMMatrix(getComputedStyle(cardRef.current ?? document.body).transform)
      if (Number.isFinite(m.m42)) { yStart = m.m42 - CLIP_TOP; xStart = m.m41 }
    } catch { /* keep the resting place */ }
    drag.current = {
      id: e.pointerId, x0: e.clientX - xStart * k0, y0: e.clientY, yStart, moved: false,
      ...startFlags(inserted, yStart),
      vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, t: performance.now(),
    }
    // It hangs from the point it is held by and swings about it (see useCardSwing). `speed` is how fast the pointer is moving sideways, in
    // plate units per second, fading to nothing once the pointer has been still for a moment.
    const box = cardRef.current?.getBoundingClientRect()
    if (box) {
      window.clearTimeout(originTimer.current)
      const px = clamp((e.clientX - box.left) / k0, 0, box.width / k0)
      const py = clamp((e.clientY - box.top) / k0, 0, box.height / k0)
      swing.start(px, py, box.height / k0, () => {
        const d = drag.current
        return d ? (d.vx * Math.exp(-(performance.now() - d.t) / 1000 / 0.06)) / k0 : 0
      })
    }
  }
  // During the page's light/dark fade the browser sends presses to the page root: see useFadePress.
  useFadePress({ card: cardRef, plate: plateRef, grab: onCardDown, toggle, suppressClick, watch: dark })
  const onCardMove = (e: ReactPointerEvent) => {
    const d = drag.current
    const card = cardRef.current
    if (!d || !card || e.pointerId !== d.id) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    // how fast the pointer is moving (smoothed), so a card let go mid-flick is thrown that way
    const now = performance.now()
    const dtv = (now - d.t) / 1000
    if (dtv > 0.001) {
      d.vx = d.vx * 0.5 + ((e.clientX - d.lx) / dtv) * 0.5
      d.vy = d.vy * 0.5 + ((e.clientY - d.ly) / dtv) * 0.5
      d.lx = e.clientX
      d.ly = e.clientY
      d.t = now
    }
    if (!d.moved) {
      if (Math.hypot(dx, dy) < TAP_SLOP) return // still a tap
      d.moved = true
      setDragging(true)
    }
    // screen pixels → the plate's own units (the whole switch is scaled by --hk-s)
    const k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hk-s")) || 1
    const { x, y } = constrainDrag(
      d, clamp(d.yStart + dy / k, DRAG_Y.min, DRAG_Y.max), clamp(dx / k, -window.innerWidth / k, window.innerWidth / k), e.clientX,
    )
    card.style.setProperty("--y", y.toFixed(1))
    card.style.setProperty("--x", x.toFixed(1))
    // The sides of the screen are walls for a held card too: it cannot be pushed past them.
    const wall = card.getBoundingClientRect()
    const over = wall.left < 0 ? -wall.left : wall.right > window.innerWidth ? window.innerWidth - wall.right : 0
    if (over !== 0) card.style.setProperty("--x", (x + over / k).toFixed(1))
    const going = goingIn(d) // in the slot, or going into it from above
    swing.hold(going) // no swinging while the card is slotting in
    // ── the room follows the card live, while it is being dragged ──
    // As soon as the card is out of the slot the room goes dark, and as soon as it is in, light: no waiting for the release, no
    // delay, and it can flip back and forth in one drag. (The same test is used when the card is let go, below.)
    // The page cross-fades slowly, the plate and everything else with it, but the CARD is kept out of the fade (keepLive) and drawn
    // live on top of it. Fading it with the rest would hold it on a snapshot of the old page, and the card you are dragging would
    // stop following your pointer. The clip box is what is named, not the bare card, so the slot still hides its lower part.
    const liveIn = inSlot(d, y)
    if (liveIn !== insertedRef.current) {
      insertedRef.current = liveIn
      setInserted(liveIn)
      setTheme(!liveIn, undefined, { keepLive: clipRef.current, slow: true })
    }
    const off = !going // not in the slot, so nothing hides the card (see .hk-clip)
    setOpen((prev) => (prev === off ? prev : off))
  }
  const onCardUp = (e: ReactPointerEvent) => {
    const d = drag.current
    const card = cardRef.current
    if (!d || !card || e.pointerId !== d.id) return
    drag.current = null
    const sw = swing.stop()
    if (!d.moved) { card.style.removeProperty("--r"); swing.resetOrigin(); return } // a plain tap: the click on the plate flips the switch
    const y = parseFloat(card.style.getPropertyValue("--y"))
    const x = parseFloat(card.style.getPropertyValue("--x"))
    suppressClick.current = true
    window.setTimeout(() => { suppressClick.current = false }, 0)
    setDragging(false)
    // let go with the card clear of the plate: it is dropped, falls off the screen, and a new one appears where it was
    if (isThrownAway(x, y)) {
      // Thrown while swinging about the grip: carry on from exactly where it is, but turning about its middle from here on (the fall
      // does that). Turning about the middle instead of the grip moves the card, so shift it by the difference, and let the swing's
      // spin carry on into the tumble.
      let tx = x
      let ty = y
      if (sw) {
        const a = (sw.theta * Math.PI) / 180
        const dx = sw.px - card.offsetWidth / 2
        const dy = sw.py - card.offsetHeight / 2
        tx += dx - (dx * Math.cos(a) - dy * Math.sin(a))
        ty += dy - (dx * Math.sin(a) + dy * Math.cos(a))
        card.style.setProperty("--x", tx.toFixed(1))
        card.style.setProperty("--y", ty.toFixed(1))
      }
      swing.resetOrigin()
      // The speed it was moving at when last seen, fading away with how long the pointer has since been still (no move events arrive
      // while it is held still, so the last speed would otherwise linger): hold it and let go and it just drops.
      const still = (performance.now() - d.t) / 1000
      const keep = Math.exp(-still / 0.06)
      throwAway(tx, ty, d.vx * keep, d.vy * keep, sw?.omega)
      return
    }
    ;["--y", "--x", "--r"].forEach((v) => card.style.removeProperty(v))
    // it swings back upright about the grip, then its turning point goes back to its middle
    originTimer.current = window.setTimeout(swing.resetOrigin, 700)
    // let go while it was off to the side: it springs back, so keep it unclipped until it has swung back into line (else the
    // part below the slot line would vanish the instant you release)
    if (open) openTimer.current = window.setTimeout(() => setOpen(false), CLIP_RETURN_MS)
    // In the slot only if it actually IS in the slot when let go, however it got there: still locked in it (and not pulled most of
    // the way out), or on its way in from above and centred. Pulled clear of the slot and let go anywhere else, including back down
    // beside it, it is out, so the room goes dark. (Judging a card that started in the slot by its height alone sent it back in.)
    const wantIn = inSlot(d, y)
    if (wantIn !== insertedRef.current) setCard(wantIn) // normally already so: the room has been following the card all along
  }

  return (
    <div className="mx-auto mt-6 w-full">
      <div className="hk-fit">
        <div className="hk" style={STAGE_VARS} data-mode={inserted ? "light" : "dark"} data-drag={dragging || undefined} data-open={open || undefined} data-fall={falling || undefined} data-respawn={respawning || undefined} data-empty={empty || undefined}>
          <div className="hk-scene" ref={sceneRef}>
            <div
              className="hk-switch"
              role="button"
              tabIndex={0}
              aria-pressed={inserted}
              aria-label={
                inserted
                  ? "Room power switch. Light mode is on: the key card is in and the lights are on. Press to remove the card and switch to dark mode."
                  : "Room power switch. Dark mode is on: the key card is out and the lights are off. Press to slot the card in and switch to light mode."
              }
              onClick={() => { if (!suppressClick.current) toggle() }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggle()
                }
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((z) => (
                <div key={z} className="hk-edge" style={{ transform: `translateZ(${z}px)` }} />
              ))}
              <div className="hk-plate-front" ref={plateRef}>
                <div className="hk-slot" />
                <div className="hk-led" />
                <div className="hk-label">Room light</div>

                <div className="hk-clip" ref={clipRef}>
                  <div
                    className="hk-card"
                    data-face={FACES[face]}
                    ref={cardRef}
                    onPointerDown={onCardDown}
                    onPointerMove={onCardMove}
                    onPointerUp={onCardUp}
                    onPointerCancel={onCardUp}
                  >
                    <div className="hk-card-body" data-face={FACES[face]}>
                      <CardFace name={FACES[face]} />
                    </div>
                    {/* the back of the card, seen as it tumbles */}
                    <div className="hk-card-back" aria-hidden="true">
                      <CardBack name={FACES[face]} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* no visible caption; screen readers still hear the mode change */}
      <p aria-live="polite" className="sr-only">
        {inserted ? "Light mode · remove key card" : "Dark mode · insert key card"}
      </p>
    </div>
  )
}
