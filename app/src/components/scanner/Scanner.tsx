import { useEffect } from "react"
import { cn } from "@/lib/utils"
import qrRaw from "./qr.txt?raw"
import "./scanner.css"
import { useScanner } from "./useScanner"

/** Boarding QR → https://youtu.be/dQw4w9WgXcQ?si=NiMndHjBFlu8hmSU (version 3, ECC L, pre-encoded 29×29). */
const QR_ROWS = qrRaw.trim().split(/\s+/)

/**
 * Side walls of the phone: one continuous wall around the rounded-rectangle body, built from vertical facets
 * (straight edges plus finely segmented corners) instead of stacked layers, so it reads as a single piece of titanium.
 * ~20px thick on a 170px-wide body is the same ratio as a modern iPhone (≈8mm thick, ≈71mm wide).
 */
const PHONE_W = 170
const PHONE_H = 340
const CORNER_R = 32
const PHONE_THICKNESS = 20.4
const ARC_STEPS = 10
/** The glass face wears a ~2.5px titanium rim outside its box; the walls follow that outer edge so they're as wide as the screen above. */
const RIM = 2.5
const OUT_W = PHONE_W + 2 * RIM
const OUT_H = PHONE_H + 2 * RIM
const OUT_R = CORNER_R + RIM

/** Titanium lightness down the wall: a bright polished edge by the glass, softer mid-tones, darker toward the back. */
const edgeLightness = (t: number) => 18 + 40 * Math.exp(-Math.pow((t - 0.12) / 0.16, 2)) + 10 * (1 - t)

/** Light comes from the upper left, so walls facing that way are brighter. `shade` is -1…1. */
const wallGradient = (shade: number) =>
  `linear-gradient(180deg, ${Array.from({ length: 12 }, (_, k) => {
    const t = Math.max(0.03, k / 11)
    return `hsl(40 2.5% ${(edgeLightness(t) + shade * 5 + 1).toFixed(1)}%) ${(t * 100).toFixed(0)}%`
  }).join(", ")})`

const LIGHT = { x: -0.6, y: -0.8 }
const shadeOf = (angle: number) => Math.sin(angle) * LIGHT.x - Math.cos(angle) * LIGHT.y // outward normal · light

interface Facet {
  x: number
  y: number
  len: number
  angle: number
}
const straight = (x0: number, y0: number, x1: number, y1: number): Facet[] => [
  { x: x0, y: y0, len: Math.hypot(x1 - x0, y1 - y0), angle: Math.atan2(y1 - y0, x1 - x0) },
]
const arc = (cx: number, cy: number, startDeg: number): Facet[] =>
  Array.from({ length: ARC_STEPS }, (_, i) => {
    const d = Math.PI / 2 / ARC_STEPS
    const a0 = (startDeg * Math.PI) / 180 + i * d
    const a1 = a0 + d
    const x0 = cx + OUT_R * Math.cos(a0)
    const y0 = cy + OUT_R * Math.sin(a0)
    const x1 = cx + OUT_R * Math.cos(a1)
    const y1 = cy + OUT_R * Math.sin(a1)
    return { x: x0, y: y0, len: Math.hypot(x1 - x0, y1 - y0), angle: Math.atan2(y1 - y0, x1 - x0) }
  })

// clockwise around the body. The bottom straight edge is the port wall, drawn separately below.
const FACETS: Facet[] = [
  ...straight(OUT_R, 0, OUT_W - OUT_R, 0),
  ...arc(OUT_W - OUT_R, OUT_R, -90),
  ...straight(OUT_W, OUT_R, OUT_W, OUT_H - OUT_R),
  ...arc(OUT_W - OUT_R, OUT_H - OUT_R, 0),
  ...arc(OUT_R, OUT_H - OUT_R, 90),
  ...straight(0, OUT_H - OUT_R, 0, OUT_R),
  ...arc(OUT_R, OUT_R, 180),
]

const WALL_FACETS = FACETS.map((f) => ({
  width: `${(f.len + 0.7).toFixed(2)}px`, // a hair of overlap so no crack shows between facets
  height: `${PHONE_THICKNESS + 0.3}px`,
  transform: `translate3d(${(f.x - RIM).toFixed(2)}px, ${(f.y - RIM).toFixed(2)}px, 0) rotateZ(${f.angle.toFixed(4)}rad) rotateX(-90deg)`,
  background: wallGradient(shadeOf(f.angle)),
}))
const PORT_WALL_BACKGROUND = wallGradient(shadeOf(Math.PI)) // faces the viewer, away from the light

interface ScannerProps {
  /** Whether the gate is showing. When it flips back to true the scanner resets. */
  visible: boolean
  onBoarded: () => void
}

export function Scanner({ visible, onBoarded }: ScannerProps) {
  const { fitRef, phoneRef, captionRef, idle, near, success, status, onPhonePointerDown } = useScanner({ visible, onBoarded })

  // While the gate is showing the page behind it must not scroll (keyboard, touch drag, scrollbar or overscroll):
  // the wheel is already used to slide the phone up. See `html.gate-lock` in scanner.css.
  useEffect(() => {
    if (!visible) return
    const root = document.documentElement
    root.classList.add("gate-lock")
    return () => root.classList.remove("gate-lock")
  }, [visible])

  return (
    <div
      id="gate"
      className={cn(near && "near", success && "success", !visible && "hidden")}
      role="dialog"
      aria-label="Ticket scanner. Drag the phone up to scan and board."
      aria-hidden={!visible}
    >
      <div className="scan-glow" aria-hidden="true" />
      <div className="scan-stage">
        {/* shadcn's shimmer utility */}
        <div
          ref={captionRef}
          className="shimmer mb-2.5 text-center font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
        >
          Scan boarding pass to enter
        </div>

        <div className="scanner-fit" ref={fitRef}>
          <div className="scanner-wrap">
            <div className="scene">
              <div className="floor-shadow" aria-hidden="true" />

              {/* rear wall joining head and base */}
              <div className="box box--spine" aria-hidden="true">
                <div className="f f--front" />
                <div className="f f--left" />
                <div className="f f--right" />
                <div className="f f--top" />
              </div>

              {/* base with the scan window */}
              <div className="box box--base" aria-hidden="true">
                <div className="f f--front" />
                <div className="f f--left" />
                <div className="f f--right" />
                <div className="f f--top">
                  <div className="glass" />
                </div>
              </div>

              <div className="halo" aria-hidden="true" />

              {/* the phone, lying flat; slides up into the slot */}
              <div className={cn("phone3d", !idle && "phone3d--still")}>
                <div className="phone" ref={phoneRef} onPointerDown={onPhonePointerDown}>
                  <div className="phone__shadow" />
                  <div className="phone__edges" style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
                    {WALL_FACETS.map((style, i) => (
                      <div key={i} className="phone__wall" style={style} />
                    ))}
                    <div className="phone__port" style={{ height: `${PHONE_THICKNESS + 0.3}px`, background: PORT_WALL_BACKGROUND }} />
                  </div>
                  <div className="phone__face">
                    <div className="phone__screen">
                      <div className="phone__notch" aria-hidden="true" />
                      <div className="phone__home" aria-hidden="true" />
                      <div className="ticket">
                        <div className="qr" role="img" aria-label="Boarding QR code" style={{ gridTemplateColumns: `repeat(${QR_ROWS.length}, 1fr)` }}>
                          {QR_ROWS.join("")
                            .split("")
                            .map((c, i) => (
                              <i key={i} className={c === "1" ? "on" : undefined} />
                            ))}
                        </div>
                        <div className="ticket__route">
                          HKG <span>→</span> LHR
                        </div>
                        <div className="ticket__head">
                          <span className="ticket__brand">MAT ✈</span>
                          <span className="ticket__seat">1A · W</span>
                        </div>
                        <div className="ticket__foot">M. Au-Yeung · Senior PD</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glow" aria-hidden="true" />

              {/* head: display + lamps, with the label on its front */}
              <div className="box box--head" aria-hidden="true">
                <div className="f f--left" />
                <div className="f f--right" />
                <div className="f f--front">
                  <span className="box__label">Design in flight</span>
                </div>
                <div className="f f--top">
                  <div className="dispscreen">
                    <span className="box__label scanner__status" aria-live="polite">
                      {status}
                    </span>
                  </div>
                  <div className="lamps">
                    <span className="lamp lamp--green" />
                    <span className="lamp lamp--red" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The swipe-up cue: one set of four chevrons that morphs between two states. Idle: two thin ones pulse
              upward under the phone. Dragging or scrolling: the stroke thickens, they grow, two more unfold above, and
              they go ghost-faint and light up from the bottom in step with how far up the slot the phone is. Letting go
              early morphs them back; a successful scan fades them out. They stay put: the phone moves, they don't. */}
          <div className={cn("chevrons", !idle && "chevrons--drag", success && "chevrons--gone")} aria-hidden="true">
            {[2, 1, 0].map((n) => (
              <svg key={n} className={cn("chev", `chev--${n}`, n > 1 && "chev--extra")} viewBox="0 0 36 9" preserveAspectRatio="none" style={{ "--i": n } as React.CSSProperties}>
                <path d="M-6 12 L18 0 L42 12" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* skip the scan and go straight to the site; the gate fades out the same way as after a scan */}
      <button
        type="button"
        onClick={onBoarded}
        /* Enter on the button should press the button, not also trigger the gate's "Enter boards" shortcut */
        onKeyDown={(e) => e.stopPropagation()}
        tabIndex={visible && !success ? 0 : -1}
        className={cn(
          "absolute top-5 right-5 z-10 cursor-pointer rounded-full border border-border bg-background/60 px-4 py-2 font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase backdrop-blur-sm transition-[color,opacity,background-color] duration-300 outline-none hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/60",
          success && "pointer-events-none opacity-0",
        )}
      >
        Skip
      </button>
    </div>
  )
}
