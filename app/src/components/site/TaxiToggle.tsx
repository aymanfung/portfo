import { useRef } from "react"
import { useParallax, useStageFit, useThemeSwitch } from "@/hooks/use-theme-switch"
import "./taxi-toggle.css"

const STAGE_W = 760
/** Overall size of the model: 1 = the full 760px stage, lower = smaller. */
const SIZE = 0.7
const PARALLAX = { ry: 10, rx0: -6, rx: 5 }

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

export type TaxiVariant = "london" | "newyork"

const COPY: Record<TaxiVariant, { light: string; dark: string; labelLight: string; labelDark: string }> = {
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
 *  - "london" (default): the black-cab oval. Lit orange = light mode; click and it switches off = dark mode.
 *  - "newyork": the rooflight. TAXI lit = light mode; click and it goes OFF DUTY (OFF DUTY lights up) = dark mode.
 * The dark theme is the `.dark` class on <html>. The sign is a real button (keyboard and screen reader).
 */
export function TaxiToggle({ variant = "london" }: { variant?: TaxiVariant }) {
  const { dark, setTheme } = useThemeSwitch()
  const sceneRef = useRef<HTMLDivElement>(null)
  useStageFit(STAGE_W, SIZE, "--taxi-s")
  useParallax(sceneRef, PARALLAX)

  const toggle = () => setTheme(!dark)

  return (
    <div className="mx-auto mt-6 w-full">
      <div className="taxi-fit">
        <div className="taxi" data-mode={dark ? "dark" : "light"} data-variant={variant}>
          <div className="taxi-floor-shadow" />
          <div className="taxi-scene" ref={sceneRef}>
            <Slab className="table" />

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
              {variant === "london" ? <LondonSign /> : <NewYorkSign />}
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
