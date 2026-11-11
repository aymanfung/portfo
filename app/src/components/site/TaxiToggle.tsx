import { useRef } from "react"
import { useParallax, useStageFit, useThemeSwitch } from "@/hooks/use-theme-switch"
import "./taxi-toggle.css"

/** The table the light sits on is 640px wide in its own design units; everything is scaled from that. */
const TABLE_W = 640
/** Side space kept clear of the screen edge, per side, on a phone. */
const GUTTER = 16
/** How big it may get: nearly the full width of a phone, a more modest size on a larger screen. */
const maxScale = (vw: number) => (vw < 600 ? 0.9 : 0.7)
/** Resting tilt and mouse sway. The Hong Kong taxi is seen from higher up so its folded-down disc shows in the tray. */
const PARALLAX = { ry: 10, rx0: -6, rx: 5 }
const PARALLAX_HK = { ry: 10, rx0: -22, rx: 5 }

/** Slab faces: top, front, back, left, right. */
function Slab({ className }: { className: string }) {
  return (
    <div className={`slab ${className}`}>
      <i className="t" />
      <i className="fr" />
      <i className="bk" />
      <i className="lf" />
      <i className="rt" />
    </div>
  )
}

/** The three lettered panels. Rendered twice: once on the front, once on the back (rotated 180°). */
function Panels({ back = false }: { back?: boolean }) {
  return (
    <div className={`taxi-face${back ? " is-back" : ""}`}>
      <div className="taxi-panel p-side-l"><span>OFF<br />DUTY</span></div>
      <div className="taxi-panel p-center"><span>TAXI</span></div>
      <div className="taxi-panel p-side-r"><span>OFF<br />DUTY</span></div>
    </div>
  )
}

/** New York rooflight: black housing, OFF DUTY | TAXI | OFF DUTY panels, amber end lenses. */
function NewYorkSign() {
  return (
    <>
      <Slab className="rim" />
      <Slab className="body" />
      <Slab className="roof" />
      <Slab className="lens lens-l" />
      <Slab className="lens lens-r" />
      <Panels />
      <Panels back />
    </>
  )
}

/** The oval body is a stack of ellipse slices: full size along the sides, rounding off at the back and the front bevel. */
const LONDON_LAYERS = Array.from({ length: 28 }, (_, i) => ({
  z: 35 - i * 2.5,
  s: i < 3 ? 0.94 + 0.02 * i : i < 18 ? 1 : 1 - Math.pow((i - 17) / 11, 2) * 0.35,
}))

/** London black-cab light: a glossy black oval with a glowing orange diamond-textured lens and black TAXI lettering. */
function LondonSign() {
  return (
    <>
      <Slab className="plinth" />
      <div className="ldn-spill" />
      <div className="ldn">
        {LONDON_LAYERS.map((l, i) => (
          <div key={i} className="ldn-layer" style={{ transform: `translateZ(${l.z}px) scale(${l.s})` }} />
        ))}
        <div className="ldn-glow" />
        <div className="ldn-lens"><span>TAXI</span></div>
      </div>
    </>
  )
}

/** Hong Kong taxi, the first design: the light box with TAXI / 的士 in red. These parts never move (the disc beside them is the control). */
function HongKongBox() {
  return (
    <>
      <Slab className="hkt-flange" />
      <div className="hkt-lightbox" aria-hidden="true">
        <div className="hkt-face hkt-back"><span className="hkt-text">TAXI</span></div>
        <div className="hkt-face hkt-cap hkt-cap-l"><span className="hkt-zh">的<br />士</span></div>
        <div className="hkt-face hkt-cap hkt-cap-r"><span className="hkt-zh">的<br />士</span></div>
        <div className="hkt-face hkt-lid" />
        <div className="hkt-face hkt-front"><span className="hkt-text">TAXI</span></div>
      </div>
      <Slab className="hkt-tray" />
      <Slab className="hkt-pad" />
      <Slab className="hkt-hinge" />
      <Slab className="hkt-post-l" />
      <Slab className="hkt-post-r" />
    </>
  )
}

/** The 空車 FOR HIRE disc in its holder: upright in light mode, folded flat into the tray in dark mode. */
function HongKongFlag() {
  return (
    <div className="hkt-flag-anchor">
      <div className="hkt-flag">
        <div className="hkt-disc">
          {[-2, -1, 0, 1, 2].map((z) => (
            <div key={z} className="hkt-disc-rim" style={{ transform: `translateZ(${z}px)` }} />
          ))}
          <div className="hkt-disc-back" />
          <div className="hkt-disc-front">
            <span className="hkt-disc-zh">空車</span>
            <span className="hkt-disc-en">FOR HIRE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export type TaxiVariant = "hongkong" | "london" | "newyork"

const COPY: Record<TaxiVariant, { light: string; dark: string; labelLight: string; labelDark: string }> = {
  hongkong: {
    light: "For hire · tap the sign to fold it down",
    dark: "Not for hire · tap the sign to flip it up",
    labelLight: "For hire sign, upright and the lamp lit. Light mode is on. Press to fold it down for dark mode.",
    labelDark: "For hire sign, folded down and the lamp off. Dark mode is on. Press to flip it up for light mode.",
  },
  newyork: {
    light: "On duty · tap the sign to go off duty",
    dark: "Off duty · tap the sign to go back on",
    labelLight: "Taxi sign, on duty. Light mode is on. Press for dark mode.",
    labelDark: "Taxi sign, off duty. Dark mode is on. Press for light mode.",
  },
  london: {
    light: "For hire · tap the light to switch it off",
    dark: "Hired · tap the light to switch it on",
    labelLight: "Taxi light, lit and for hire. Light mode is on. Press for dark mode.",
    labelDark: "Taxi light, switched off. Dark mode is on. Press for light mode.",
  },
}

/**
 * A taxi light that is also the dark-mode switch. Two designs, picked with `variant`:
 *  - "hongkong": the red light box with the FOR HIRE disc. The disc is the control: upright = light, folded flat = dark.
 *  - "london" (default): the black-cab oval. Lit orange = light mode; click and it switches off = dark mode.
 *  - "newyork": the rooflight. TAXI lit = light mode; click and it goes OFF DUTY (OFF DUTY lights up) = dark mode.
 * The dark theme is the `.dark` class on <html>. The sign is a real button (keyboard and screen reader).
 */
export function TaxiToggle({ variant = "london" }: { variant?: TaxiVariant }) {
  const { dark, setTheme } = useThemeSwitch()
  const sceneRef = useRef<HTMLDivElement>(null)
  useStageFit(TABLE_W, 1, "--taxi-s", GUTTER * 2, maxScale)
  useParallax(sceneRef, variant === "hongkong" ? PARALLAX_HK : PARALLAX)

  const toggle = () => setTheme(!dark)

  return (
    <div className="mx-auto mt-6 w-full">
      <div className="taxi-fit">
        <div className="taxi" data-mode={dark ? "dark" : "light"} data-variant={variant}>
          <div className="taxi-floor-shadow" />
          <div className="taxi-scene" ref={sceneRef}>
            <Slab className="table" />
            {variant === "hongkong" ? <HongKongBox /> : null}

            <div
              className="taxi-sign"
              role="button"
              tabIndex={0}
              aria-pressed={dark}
              aria-label={dark ? COPY[variant].labelDark : COPY[variant].labelLight}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggle()
                }
              }}
            >
              {variant === "london" ? <LondonSign /> : variant === "hongkong" ? <HongKongFlag /> : <NewYorkSign />}
            </div>
          </div>
        </div>
      </div>
      <p
        aria-live="polite"
        className="text-center font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase"
      >
        {dark ? COPY[variant].dark : COPY[variant].light}
      </p>
    </div>
  )
}
