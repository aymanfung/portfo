import { useEffect, useRef, useState } from "react"
import { useParallax, useStageFit, useThemeSwitch } from "@/hooks/use-theme-switch"
import "./hotel-key-toggle.css"

const STAGE_W = 760
/** Overall size of the model: 1 = the full 760px stage, lower = smaller. */
const SIZE = 0.7
const PARALLAX = { ry: 8, rx0: 0, rx: 6 }

/** How long after the card moves the room's power actually changes, like the real thing. */
const POWER_ON_DELAY = 420
const POWER_OFF_DELAY = 260

/**
 * The hotel-room power switch: slot the key card in and the lights come on (light mode); pull it out and the
 * power cuts (dark mode). The whole plate is one button (keyboard and screen reader friendly).
 * The card moves first, the room follows a beat later.
 */
export function HotelKeyToggle() {
  const { dark, setTheme } = useThemeSwitch()
  const [inserted, setInserted] = useState(!dark)
  const busy = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const sceneRef = useRef<HTMLDivElement>(null)
  useStageFit(STAGE_W, SIZE, "--hk-s")
  useParallax(sceneRef, PARALLAX)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // If another toggle on the page changes the theme, the card follows it (unless this switch is mid-flip).
  useEffect(() => {
    if (!busy.current) setInserted(!dark)
  }, [dark])

  const toggle = () => {
    if (busy.current) return
    busy.current = true
    const next = !inserted
    setInserted(next) // the card moves now…
    timer.current = window.setTimeout(() => {
      setTheme(!next) // …and the room's power follows
      timer.current = window.setTimeout(() => { busy.current = false }, 500)
    }, next ? POWER_ON_DELAY : POWER_OFF_DELAY)
  }

  return (
    <div className="mx-auto mt-6 w-full">
      <div className="hk-fit">
        <div className="hk" data-mode={inserted ? "light" : "dark"}>
          <div className="hk-scene" ref={sceneRef}>
            <div className="hk-wall" />

            <div
              className="hk-switch"
              role="button"
              tabIndex={0}
              aria-pressed={inserted}
              aria-label={
                inserted
                  ? "Room power switch. Key card is in and the lights are on. Press to remove the card and turn the lights off."
                  : "Room power switch. Key card is out and the lights are off. Press to slot the card in and turn the lights on."
              }
              onClick={toggle}
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
                <div className="hk-label">Key card</div>

                <div className="hk-clip">
                  <div className="hk-card">
                    <div className="hk-card-body">
                      <span className="hk-mono">MA</span>
                      <span className="hk-rule" />
                      <span className="hk-chip" />
                      <span className="hk-room">ROOM<br />1A · W</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p
        aria-live="polite"
        className="text-center font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase"
      >
        {inserted ? "Lights on · tap to take your key card out" : "No power · tap to slot in your key card"}
      </p>
    </div>
  )
}
