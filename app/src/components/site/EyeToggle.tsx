import { useRef, useState } from "react"
import { useThemeSwitch } from "@/hooks/use-theme-switch"
import { EyeTracker } from "@/components/site/EyeTracker"

/**
 * A dark-mode toggle that is a little creature. Click it and:
 *  - its body morphs (light = a round mark, dark = a hexagon),
 *  - it blinks and whips its head, then goes back to following your cursor,
 *  - the new theme grows out of the eye as a circle across the whole page.
 * The eye watches the pointer anywhere on the page. It is one real button (keyboard and screen reader friendly).
 */
export function EyeToggle() {
  const { dark, setTheme } = useThemeSwitch()
  const [kick, setKick] = useState(0)
  const btn = useRef<HTMLButtonElement>(null)

  const toggle = () => {
    const r = btn.current?.getBoundingClientRect()
    setKick((k) => k + 1)
    setTheme(!dark, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined)
  }

  return (
    <div className="eye-toggle mx-auto mt-10 flex flex-col items-center">
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-pressed={dark}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        className="cursor-pointer rounded-full p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
      >
        <EyeTracker
          shape={dark ? "Hexagon" : "Circle"}
          size={96}
          eyeScale={1.25}
          follow={70}
          bounce={45}
          within="html"
          kick={kick}
        />
      </button>
      <p
        aria-live="polite"
        className="mt-3 text-center font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase"
      >
        {dark ? "Click the eye · back to light" : "Click the eye · go dark"}
      </p>
    </div>
  )
}
