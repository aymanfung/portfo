import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { useParallax, useStageFit, useThemeSwitch } from "@/hooks/use-theme-switch"
import "./hotel-key-toggle.css"

/** The switch is laid out in a box 420px wide in its own design units; everything is scaled from that. */
const DESIGN_W = 420
/** Side space kept clear of the screen edge, per side, on a phone. */
const GUTTER = 16
/** How big it may get: nearly the full width of a phone; on a larger screen it is allowed to be bigger still. */
const maxScale = (vw: number) => (vw < 600 ? 0.9 : 1.2)
const PARALLAX = { ry: 8, rx0: 0, rx: 6 }

/* Where the card's top sits in the plate's own units (see .hk-card in hotel-key-toggle.css): slotted in, or pulled out. */
const CARD_IN = 40
const CARD_OUT = -32
/** Dragging the card: how far it may go, how close to the slot it has to be lined up, and how far a tap may wobble. */
/* The card can be dragged right out of the plate (and across the page), so these are wide; once it is in the slot it can go no lower
   than fully slotted in (IN_SLOT_MAX_Y). */
const DRAG_Y = { min: -320, max: 700 }
const DRAG_X = 420
const IN_SLOT_MAX_Y = 46
/** How far off the slot's centre line (in plate units) the card may be and still go in. The slot is 80 wide and the card 66, so physically it only has 7 to spare; this is a little more forgiving. */
const SLOT_ALIGN_X = 14
const SLOT_REACH_Y = 0
const PULLED_OUT_Y = 10
const TAP_SLOP = 5
/** After letting go off to the side, how long the card stays unclipped while it swings back to the slot. */
const CLIP_RETURN_MS = 350
/* The card height and the slot's centre line, in the same plate units as the card's position: the card is entering the slot from the
   moment its bottom edge passes that line, i.e. when its top is below SLOT_LINE - CARD_H. */
const CARD_H = 105
const SLOT_LINE = 88
const ENTER_Y = SLOT_LINE - CARD_H
/** Over how many units of travel into the slot the card eases to the slot's centre line (so it does not jump). */
const ENTER_EASE = 27

/* ── throwing the card away ──
   Let go of the card with its centre clear of the plate (past a side, below the bottom, or well above the top) and it is dropped:
   it falls off the screen, tumbling and flipping, then a new one appears at its resting place for the current mode. The plate is 150 x 200 in these units (its centre line
   is x = 0, its top is y = 0, so a card's centre is at (x, y + CARD_H / 2)). Pulling a card up out of the slot a normal distance does
   not count: only a card well above the top does (OUTSIDE_ABOVE). */
const PLATE_HALF_W = 75
const PLATE_H = 200
const OUTSIDE_ABOVE = 50
/** Gravity, in screen pixels per second squared (converted to plate units for the scale it is shown at). */
const FALL_G = 1200
/** How long the new card takes to appear again, once the old one has fallen out of sight. */
const RESPAWN_MS = 480
/** The cards that can be in the slot. The first is the hotel key; the rest turn up, at random, after one has been dropped. All are invented designs
 *  (no real logos, crests or numbers), just in the manner of the real thing. */
const FACES = ["hotel", "coral", "gold", "licence", "transit", "ace", "peri", "critter"] as const

const Contactless = () => (
  <svg className="hk-nfc" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4 4.5a5 5 0 0 1 0 7M7 2.5a8 8 0 0 1 0 11M10 0.5a11 11 0 0 1 0 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

/** An n-pointed star, as an SVG polygon `points` string. */
const star = (cx: number, cy: number, R: number, r: number, n = 8) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2
    const rad = i % 2 ? r : R
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`
  }).join(" ")

/** The back of the trading card: blue with a swirl, a red-and-white ball, and the name in yellow top and (upside down) bottom. */
function CritterBack() {
  const word = { fontFamily: "Geist Variable, sans-serif", fontWeight: 900, fontSize: 9.5, fill: "#f6c02a", stroke: "#23367e", strokeWidth: 1.6, paintOrder: "stroke", textAnchor: "middle" as const, letterSpacing: "-.3" }
  return (
    <svg className="hk-crit" viewBox="0 0 66 105" aria-hidden="true">
      <defs>
        <radialGradient id="hk-swirl" cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#f3f6ff" /><stop offset=".35" stopColor="#8fa0e8" /><stop offset="1" stopColor="#2c3f9a" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="66" height="105" rx="4" fill="#27409f" />
      <rect x="3.5" y="3.5" width="59" height="98" rx="2" fill="url(#hk-swirl)" />
      <path d="M8 60c8-22 30-40 52-28M10 78c10-12 22-6 30-14M58 70c-8 12-24 14-34 6" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="33" cy="52.5" r="14" fill="#e8e8ef" />
      <path d="M19 52.5a14 14 0 0 1 28 0z" fill="#d9322a" />
      <rect x="19" y="50.7" width="28" height="3.4" fill="#17130a" />
      <circle cx="33" cy="52.5" r="4.4" fill="#17130a" /><circle cx="33" cy="52.5" r="2.6" fill="#dfe5ff" />
      <text x="33" y="17" {...word}>CRITTER</text>
      <text x="33" y="17" {...word} transform="rotate(180 33 52.5)">CRITTER</text>
    </svg>
  )
}

/** The back of the playing card: a red frame, a lattice of diamonds, a star on a disc in the middle and a small star in each corner. */
function AceBack() {
  return (
    <svg className="hk-ace-back" viewBox="0 0 66 105" aria-hidden="true">
      <defs>
        <pattern id="hk-lattice" width="6" height="6" patternUnits="userSpaceOnUse" style={{ visibility: "visible" }}>
          <path d="M0 3 L3 0 L6 3 L3 6 Z M0 0 L6 6 M6 0 L0 6" fill="none" stroke="#e8141c" strokeWidth=".85" />
        </pattern>
      </defs>
      <rect x="3" y="3" width="60" height="99" rx="3" fill="#fff" stroke="#e8141c" strokeWidth="1" />
      <rect x="6" y="6" width="54" height="93" fill="#e8141c" />
      <rect x="9.5" y="9.5" width="47" height="86" fill="#fff" />
      <rect x="10.5" y="10.5" width="45" height="84" fill="url(#hk-lattice)" />
      <circle cx="33" cy="52.5" r="15" fill="#fff" stroke="#e8141c" strokeWidth="1.2" />
      <circle cx="33" cy="52.5" r="12" fill="#e8141c" />
      <polygon points={star(33, 52.5, 14, 5)} fill="#fff" stroke="#e8141c" strokeWidth="1" strokeLinejoin="round" />
      {[[10, 10], [56, 10], [10, 95], [56, 95]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="6" fill="#fff" stroke="#e8141c" strokeWidth="1" />
          <polygon points={star(x, y, 4.6, 1.8)} fill="#e8141c" />
        </g>
      ))}
    </svg>
  )
}

/** The back of the licence: the table of vehicle categories with their dates and codes (all invented), a signal-light mark, the licence number. */
const LICENCE_ROWS = [
  ["AM", "19.01.13", "10.03.46", "01"],
  ["A", "11.03.96", "10.03.46", "01"],
  ["B1", "11.03.96", "10.03.46", "01,15,20"],
  ["B", "11.03.98", "10.03.46", "01,15,20"],
  ["C1", "", "", ""],
  ["C", "", "", ""],
  ["D", "", "", ""],
]
function LicenceBack() {
  return (
    <div className="hk-dl-back">
      <span className="hk-dlb-13">13.</span>
      <span className="hk-dlb-light"><i /><i /><i /></span>
      <span className="hk-dlb-12">12. 115</span>
      <div className="hk-dlb-table">
        <div className="hk-dlb-row hk-dlb-head"><b>9.</b><b>10.</b><b>11.</b><b>12.</b></div>
        {LICENCE_ROWS.map(([c, a, b, d]) => (
          <div className="hk-dlb-row" key={c}><span>{c}</span><span>{a}</span><span>{b}</span><span>{d}</span></div>
        ))}
      </div>
      <span className="hk-dlb-no">ZA00506027</span>
    </div>
  )
}

/** The back of the travel card: white, the "use where you see this symbol" mark, small print, a number. Drawn landscape and turned like the front. */
function TransitBack() {
  return (
    <div className="hk-tr-back">
      <i className="hk-trb-sym" />
      <span className="hk-trb-use">Use where you<br />see this symbol</span>
      <span className="hk-trb-no">0553 6937 08 98</span>
      <span className="hk-trb-fine">The issue and use of this card is subject to the Conditions of Carriage, available online or by calling the number on your statement. Found cards should be returned to any station ticket office.</span>
      <span className="hk-trb-brand">Transport pass</span>
      <span className="hk-trb-ring"><i /></span>
      <span className="hk-trb-code">GXDR2293</span>
    </div>
  )
}

/** What is printed on the front of each card. The bank-style cards are landscape, as the real ones are (see .hk-card[data-face] in the CSS). */
function CardFace({ name }: { name: (typeof FACES)[number] }) {
  switch (name) {
    case "coral":
      return (<>
        <span className="hk-bank">bank</span>
        <span className="hk-chip" />
        <Contactless />
        <span className="hk-holder">M AU-YEUNG</span>
        <span className="hk-rings"><i /><i /></span>
      </>)
    case "gold":
      return (<>
        <span className="hk-gold-title">GOLD CARD</span>
        <span className="hk-gold-seal" />
        <span className="hk-chip" />
        <Contactless />
        <span className="hk-num">7997</span>
        <span className="hk-holder">M AU-YEUNG</span>
        <span className="hk-since">MEMBER SINCE 09</span>
      </>)
    case "licence":
      return (<>
        <span className="hk-dl-head"><b>UK</b> DRIVING LICENCE</span>
        <span className="hk-dl-photo"><i /><b /></span>
        <span className="hk-dl-line" style={{ top: 19 }}><em>1.</em> AU-YEUNG</span>
        <span className="hk-dl-line" style={{ top: 26 }}><em>2.</em> MATTHEW</span>
        <span className="hk-dl-line" style={{ top: 33 }}><em>4c.</em> LONDON</span>
        <span className="hk-dl-line" style={{ top: 40 }}><em>5.</em> AUYEU 0 M99 AB</span>
        <span className="hk-dl-sign">M. Au-Yeung</span>
      </>)
    case "transit":
      return (<>
        <span className="hk-tr-band" />
        <span className="hk-tr-title">travel</span>
        <span className="hk-tr-ring"><i /></span>
        <span className="hk-tr-sub">Transport pass</span>
        <span className="hk-tr-sub2">Issued subject to conditions</span>
      </>)
    case "critter":
      return (
        <svg className="hk-crit" viewBox="0 0 66 105" aria-hidden="true">
          <rect x="3.5" y="3.5" width="59" height="98" rx="3" fill="#f7e08a" />
          <text x="7" y="9.5" fontSize="3.4" fontWeight="600" fill="#2b2410" fontFamily="Geist Variable, sans-serif">Basic Critter</text>
          <text x="7" y="16.5" fontSize="7.4" fontWeight="800" fill="#17130a" fontFamily="Geist Variable, sans-serif" letterSpacing="-.2">Sparky</text>
          <text x="40.5" y="16" fontSize="5.2" fontWeight="800" fill="#b3211a" fontFamily="Geist Variable, sans-serif">50 HP</text>
          <circle cx="58" cy="14" r="3.1" fill="#f0c52c" stroke="#8a6a10" strokeWidth=".5" />
          <path d="M58.6 11.6 55.8 14.4h1.7l-.6 2.2 2.8-2.9h-1.7z" fill="#2a1d00" />
          <rect x="6.5" y="19.5" width="53" height="35" fill="#e9c24a" />
          <rect x="7.5" y="20.5" width="51" height="33" fill="#5f8a3a" />
          <circle cx="14" cy="27" r="4" fill="#85ad5b" /><circle cx="50" cy="26" r="5" fill="#4a7230" /><circle cx="44" cy="46" r="6" fill="#4d7a33" /><circle cx="17" cy="46" r="5" fill="#86ab58" />
          <path d="M23 30 21 23 27 27ZM42 30 47 23 44 31Z" fill="#f4d23a" /><path d="M21 23 22 25 21.4 26ZM47 23 46 25 46.6 26Z" fill="#17130a" />
          <ellipse cx="33" cy="40" rx="11.5" ry="10.5" fill="#f6d43a" />
          <ellipse cx="33" cy="33" rx="9.5" ry="7.5" fill="#f8da4a" />
          <circle cx="29.6" cy="35.5" r="1.1" fill="#17130a" /><circle cx="36.4" cy="35.5" r="1.1" fill="#17130a" />
          <circle cx="27" cy="38" r="1.4" fill="#e24a3f" /><circle cx="39" cy="38" r="1.4" fill="#e24a3f" />
          <path d="M44 38l5-4-2 5 4-3-5 8z" fill="#e3b21f" />
          <rect x="6.5" y="56" width="53" height="3.6" fill="#e6c25c" />
          <text x="9" y="58.6" fontSize="2.5" fontStyle="italic" fontWeight="600" fill="#2b2410" fontFamily="Geist Variable, sans-serif">Mouse Critter. Length: 1' 4", Weight: 13 lbs.</text>
          <circle cx="9.5" cy="68" r="2.6" fill="#f0c52c" stroke="#8a6a10" strokeWidth=".4" /><circle cx="15.5" cy="68" r="2.6" fill="#f0c52c" stroke="#8a6a10" strokeWidth=".4" />
          <text x="20" y="66.5" fontSize="4.2" fontWeight="800" fill="#17130a" fontFamily="Geist Variable, sans-serif">Spark</text>
          <text x="20" y="70.8" fontSize="2.7" fill="#2b2410" fontFamily="Geist Variable, sans-serif">If your opponent has any</text>
          <text x="20" y="74.2" fontSize="2.7" fill="#2b2410" fontFamily="Geist Variable, sans-serif">Benched Critter, choose 1 of</text>
          <text x="20" y="77.6" fontSize="2.7" fill="#2b2410" fontFamily="Geist Variable, sans-serif">them. This attack does 10.</text>
          <text x="55" y="70" fontSize="6" fontWeight="800" fill="#17130a" textAnchor="middle" fontFamily="Geist Variable, sans-serif">20</text>
          <line x1="6.5" y1="85" x2="59.5" y2="85" stroke="#17130a" strokeWidth=".4" />
          <text x="7" y="88.5" fontSize="2.6" fontWeight="700" fill="#17130a" fontFamily="Geist Variable, sans-serif">weakness</text>
          <text x="33" y="88.5" fontSize="2.6" fontWeight="700" fill="#17130a" textAnchor="middle" fontFamily="Geist Variable, sans-serif">resistance</text>
          <text x="59" y="88.5" fontSize="2.6" fontWeight="700" fill="#17130a" textAnchor="end" fontFamily="Geist Variable, sans-serif">retreat cost</text>
          <circle cx="10" cy="92" r="2.1" fill="#b8472f" /><circle cx="55.5" cy="92" r="2.1" fill="#e5e5e8" stroke="#888" strokeWidth=".3" />
          <rect x="6.5" y="94.4" width="53" height="5" fill="none" stroke="#7a5f14" strokeWidth=".35" />
          <text x="8" y="97.2" fontSize="2.3" fontStyle="italic" fontWeight="600" fill="#2b2410" fontFamily="Geist Variable, sans-serif">When several gather, their electricity can</text>
          <text x="8" y="99.2" fontSize="2.3" fontStyle="italic" fontWeight="600" fill="#2b2410" fontFamily="Geist Variable, sans-serif">build and cause lightning storms.  LV. 14</text>
        </svg>
      )
    case "peri":
      return (<>
        <svg className="hk-peri-art" viewBox="0 0 92 58" aria-hidden="true">
          <path d="M66 6c-9 4-13 14-11 26 2 10 8 17 15 20 1-9-1-14-5-20-4-7-3-17 1-26z" fill="rgba(255,255,255,.16)" />
          <path d="M34 50c-14-2-22-12-18-24 3-9 12-12 19-8" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M44 14c6-6 16-5 18 2" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="hk-peri-title">Peri Card</span>
        <span className="hk-peri-mark" />
        <span className="hk-peri-sub">FLAME GRILLED</span>
      </>)
    case "ace":
      return (<>
        <span className="hk-pc-corner hk-pc-tl">A<br />♠</span>
        <span className="hk-pc-big">♠</span>
        <span className="hk-pc-corner hk-pc-br">A<br />♠</span>
      </>)
    default:
      return (<>
        <span className="hk-mono">HOTEL</span>
        <span className="hk-rule" />
        <span className="hk-chip" />
        <span className="hk-room">ROOM<br />1A · W</span>
      </>)
  }
}
/** The card is held this far in front of the plate, in plate units, even when not turned, while it falls (plus the swing of its back edge). */
const CARD_LIFT = 6

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

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
export function HotelKeyToggle() {
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
  const clipRef = useRef<HTMLDivElement>(null) // the card (with its slot clip), kept live while the page fades (see onCardMove)
  const drag = useRef<{
    id: number; x0: number; y0: number; yStart: number; moved: boolean; locked: boolean; armed: boolean; entering: boolean
    vx: number; vy: number; lx: number; ly: number; t: number // how fast the pointer is moving (a card let go mid-flick is thrown that way)
  } | null>(null)
  const suppressClick = useRef(false) // the click that follows the end of a drag must not also flip the switch
  const [dragging, setDragging] = useState(false)
  const [face, setFace] = useState(0) // which card is in use: 0 is the hotel key; every card that drops is replaced by a different one
  const [falling, setFalling] = useState(false) // thrown away: tumbling off the screen
  const [respawning, setRespawning] = useState(false) // the new card is appearing where the old one was
  const fallRaf = useRef(0)
  const respawnTimer = useRef<number | undefined>(undefined)
  const [aimed, setAimed] = useState(false) // dragging an out-card and it is lined up with the slot
  // The card is only hidden below the slot line (see .hk-clip) when it is lined up with the slot, i.e. actually going in. Held off
  // to the side it is NOT in the slot, so it must stay fully visible over the plate: `open` turns the clip off for that.
  const [open, setOpen] = useState(false)
  const openTimer = useRef<number | undefined>(undefined)
  useStageFit(DESIGN_W, 1, "--hk-s", GUTTER * 2, maxScale)
  useParallax(sceneRef, PARALLAX)

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    window.clearTimeout(openTimer.current)
    window.clearTimeout(respawnTimer.current)
    cancelAnimationFrame(fallRaf.current)
  }, [])

  // If another toggle on the page changes the theme, the card follows it (unless this switch is mid-flip).
  useEffect(() => {
    if (!busy.current && !drag.current) setInserted(!dark)
  }, [dark])

  /** Put the card in or take it out. */
  const setCard = (next: boolean) => {
    if (busy.current || next === insertedRef.current) return
    busy.current = true
    pendingPower.current = next
    setInserted(next) // the card moves now…
    timer.current = window.setTimeout(() => {
      pendingPower.current = null
      setTheme(!next) // …and the room's power follows
      timer.current = window.setTimeout(() => { busy.current = false }, 500)
    }, next ? POWER_ON_DELAY : POWER_OFF_DELAY)
  }
  const toggle = () => setCard(!inserted)

  // ── dragging the card ───────────────────────────────────────────────────────────────────────────────────────────
  // While it is held, the card's position is written straight to its CSS variables (no React render per pixel). On
  // release they are cleared, so it eases to wherever the switch now says it belongs.
  const onCardDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
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
      if (Number.isFinite(m.m42)) { yStart = m.m42 - 150; xStart = m.m41 }
    } catch { /* keep the resting place */ }
    drag.current = {
      id: e.pointerId, x0: e.clientX - xStart * k0, y0: e.clientY, yStart, moved: false,
      locked: inserted && yStart >= PULLED_OUT_Y, armed: !(inserted && yStart >= PULLED_OUT_Y) && yStart <= ENTER_Y, entering: false,
      vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, t: performance.now(),
    }
  }
  // While the page is cross-fading between light and dark (a view transition), the browser puts its own layers over the document and
  // sends every press to the page's root element instead of to the elements under it: the card would not respond for the length
  // of the fade. So catch that press at the window, and if it landed on the card, grab the card as if it had been hit directly.
  const grabRef = useRef(onCardDown)
  grabRef.current = onCardDown
  useEffect(() => {
    const onWinDown = (e: PointerEvent) => {
      if (e.target !== document.documentElement) return
      const r = cardRef.current?.getBoundingClientRect()
      if (!r || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
      grabRef.current(e as unknown as ReactPointerEvent)
    }
    window.addEventListener("pointerdown", onWinDown, true)
    return () => window.removeEventListener("pointerdown", onWinDown, true)
  }, [])
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
    let y = clamp(d.yStart + dy / k, DRAG_Y.min, DRAG_Y.max)
    let x = clamp(dx / k, -DRAG_X, DRAG_X)
    // ── the slot only takes the card from the middle top ──
    // The card can only go in by dropping straight down into the slot from above it, centred. "Armed" means it is above the slot
    // line, so a drop from here can go in. Crossing the line while centred starts it going in: it eases to the slot's centre line
    // over ENTER_EASE units, then is held there (locked): it cannot go left or right until it is pulled back up clear of the slot
    // (on the way out it picks up the pointer from where it is, no jump: x0 is re-based). Brought down BESIDE the slot instead, it
    // is not armed, so sliding it sideways into line does nothing: it is just a card held over the plate.
    if (d.locked) {
      if (y <= ENTER_Y) {
        d.locked = false
        d.armed = true
        d.entering = false
        d.x0 = e.clientX
      }
      x = 0
    } else if (y <= ENTER_Y) {
      d.armed = true
      d.entering = false
    } else if (d.armed && Math.abs(x) <= SLOT_ALIGN_X) {
      d.entering = true
      const t = clamp((y - ENTER_Y) / ENTER_EASE, 0, 1)
      x *= 1 - t
      if (t >= 1) d.locked = true
    } else {
      d.armed = false // came down beside the slot (or swung out of line before it was in): not going in
      d.entering = false
    }
    if (d.locked || d.entering) y = Math.min(y, IN_SLOT_MAX_Y) // in the slot it goes no deeper than fully in
    card.style.setProperty("--y", y.toFixed(1))
    card.style.setProperty("--x", x.toFixed(1))
    card.style.setProperty("--r", `${clamp(x * 0.18, -25, 25).toFixed(1)}deg`) // tilts a little as it is swung about
    const going = d.locked || d.entering // in the slot, or going into it from above
    // ── the room follows the card live, while it is being dragged ──
    // As soon as the card is out of the slot the room goes dark, and as soon as it is in, light: no waiting for the release, no
    // delay, and it can flip back and forth in one drag. (The same test is used when the card is let go, below.)
    // The page cross-fades slowly, the plate and everything else with it, but the CARD is kept out of the fade (keepLive) and drawn
    // live on top of it. Fading it with the rest would hold it on a snapshot of the old page, and the card you are dragging would
    // stop following your pointer. The clip box is what is named, not the bare card, so the slot still hides its lower part.
    const liveIn = d.locked ? y >= PULLED_OUT_Y : d.entering && y >= SLOT_REACH_Y
    if (liveIn !== insertedRef.current) {
      insertedRef.current = liveIn
      setInserted(liveIn)
      setTheme(!liveIn, undefined, { keepLive: clipRef.current, slow: true })
    }
    const hot = !insertedRef.current && going && y >= SLOT_REACH_Y
    setAimed((prev) => (prev === hot ? prev : hot))
    const off = !going // not in the slot, so nothing hides the card (see .hk-clip)
    setOpen((prev) => (prev === off ? prev : off))
  }
  /** Drop the card: it falls with gravity off the bottom of the screen, tumbling and flipping, then respawns where it was before the drag. */
  const throwAway = (card: HTMLDivElement, x0: number, y0: number, vxScreen: number, vyScreen: number) => {
    busy.current = true // nothing else can be done with the switch until the new card is back
    window.clearTimeout(openTimer.current)
    setOpen(true) // the slot's clip must not hide any of it
    const finish = () => {
      cancelAnimationFrame(fallRaf.current)
      ;["--y", "--x", "--r", "--fx", "--lz"].forEach((v) => card.style.removeProperty(v))
      setFalling(false)
      setFace((prev) => { let n = prev; while (n === prev) n = Math.floor(Math.random() * FACES.length); return n }) // a different card each time
      setRespawning(true) // the new card pops in at its rest place (see [data-respawn] in the CSS)
      window.clearTimeout(respawnTimer.current)
      setOpen(false) // the clip is back at once: a card coming back into the slot must not show below the slot line
      respawnTimer.current = window.setTimeout(() => setRespawning(false), RESPAWN_MS)
      busy.current = false
      // The room stays in whatever mode it is on (a dropped card is always out of the slot, so that is dark): the new card simply
      // appears at the resting place for that mode. It is not put back into the slot.
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish() // no tumbling for people who asked for less motion: it just comes back
      return
    }
    setFalling(true)
    const k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hk-s")) || 1
    const g = FALL_G / k
    let x = x0
    let y = y0
    let vx = vxScreen / k
    let vy = vyScreen / k
    let rot = parseFloat(card.style.getPropertyValue("--r")) || 0
    let flip = 0
    const spin = (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 220) // degrees per second, round and round
    const flipRate = 380 + Math.random() * 320 // and end over end, so it turns to show its back
    const start = performance.now()
    let last = start
    const step = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000)
      last = now
      vy += g * dt
      x += vx * dt
      y += vy * dt
      rot += spin * dt
      flip += flipRate * dt
      card.style.setProperty("--x", x.toFixed(1))
      card.style.setProperty("--y", y.toFixed(1))
      card.style.setProperty("--r", `${rot.toFixed(1)}deg`)
      card.style.setProperty("--fx", `${flip.toFixed(1)}deg`)
      // A card turning end over end swings half of itself BEHIND its own centre plane, and the plate sits just behind that plane, so
      // the plate would cut the turning card. Push the card toward the viewer by exactly as much as its back edge swings back (half its
      // height times how far it is turned), plus a little: it then passes in front of the plate at every angle, with no jump at the start.
      card.style.setProperty("--lz", `${(CARD_LIFT + (CARD_H / 2) * Math.abs(Math.sin((flip * Math.PI) / 180))).toFixed(1)}px`)
      const b = card.getBoundingClientRect()
      const gone = b.top > window.innerHeight + 60 || b.left > window.innerWidth + 120 || b.right < -120
      if (gone || now - start > 5000) finish()
      else fallRaf.current = requestAnimationFrame(step)
    }
    fallRaf.current = requestAnimationFrame(step)
  }

  const onCardUp = (e: ReactPointerEvent) => {
    const d = drag.current
    const card = cardRef.current
    if (!d || !card || e.pointerId !== d.id) return
    drag.current = null
    if (!d.moved) return // a plain tap: the click on the plate flips the switch
    const y = parseFloat(card.style.getPropertyValue("--y"))
    const x = parseFloat(card.style.getPropertyValue("--x"))
    suppressClick.current = true
    window.setTimeout(() => { suppressClick.current = false }, 0)
    setDragging(false)
    setAimed(false)
    // let go with the card clear of the plate: it is dropped, falls off the screen, and a new one appears where it was
    const cy = y + CARD_H / 2
    if (Math.abs(x) > PLATE_HALF_W || cy > PLATE_H || cy < -OUTSIDE_ABOVE) {
      // The speed it was moving at when last seen, fading away with how long the pointer has since been still (no move events arrive
      // while it is held still, so the last speed would otherwise linger): hold it and let go and it just drops.
      const still = (performance.now() - d.t) / 1000
      const keep = Math.exp(-still / 0.06)
      throwAway(card, x, y, d.vx * keep, d.vy * keep)
      return
    }
    ;["--y", "--x", "--r"].forEach((v) => card.style.removeProperty(v))
    // let go while it was off to the side: it springs back, so keep it unclipped until it has swung back into line (else the
    // part below the slot line would vanish the instant you release)
    if (open) openTimer.current = window.setTimeout(() => setOpen(false), CLIP_RETURN_MS)
    // In the slot only if it actually IS in the slot when let go, however it got there: still locked in it (and not pulled most of
    // the way out), or on its way in from above and centred. Pulled clear of the slot and let go anywhere else, including back down
    // beside it, it is out, so the room goes dark. (Judging a card that started in the slot by its height alone sent it back in.)
    const wantIn = d.locked ? y >= PULLED_OUT_Y : d.entering && y >= SLOT_REACH_Y
    if (wantIn !== insertedRef.current) setCard(wantIn) // normally already so: the room has been following the card all along
  }

  return (
    <div className="mx-auto mt-6 w-full">
      <div className="hk-fit">
        <div className="hk" data-mode={inserted ? "light" : "dark"} data-drag={dragging || undefined} data-aim={aimed || undefined} data-open={open || undefined} data-fall={falling || undefined} data-respawn={respawning || undefined}>
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
              <div className="hk-plate-front">
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
                      {FACES[face] === "ace" ? <AceBack /> : FACES[face] === "critter" ? <CritterBack /> : FACES[face] === "transit" ? <TransitBack /> : FACES[face] === "licence" ? <LicenceBack /> : FACES[face] === "hotel" ? <span className="hk-back-text">KEY</span> : null}
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
