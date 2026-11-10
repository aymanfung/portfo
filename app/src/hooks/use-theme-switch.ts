import { useCallback, useEffect, useSyncExternalStore, type RefObject } from "react"

/** The dark theme is the `.dark` class on <html> (the shadcn tokens in index.css key off it). */
export function applyTheme(dark: boolean) {
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.style.colorScheme = dark ? "dark" : "light"
}

/* The theme lives on <html>, so every toggle on the page reads it from there and they never disagree. */
const subscribe = (notify: () => void) => {
  const mo = new MutationObserver(notify)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => mo.disconnect()
}
const isDark = () => document.documentElement.classList.contains("dark")

/** Where a circular wipe should start, in viewport pixels. */
export interface WipeOrigin {
  x: number
  y: number
}

/**
 * Light/dark state for the toggles. `setTheme` flips <html class="dark"> inside a View Transition, so the browser
 * cross-fades the whole page in one composited pass (instead of hundreds of elements each running their own colour
 * transition, which janks). Pass an `origin` and the new theme instead grows out from that point as a circle.
 * Falls back to an instant switch without View Transitions or when the user prefers reduced motion.
 */
export function useThemeSwitch() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)

  // Keep colour-scheme in sync on mount.
  useEffect(() => {
    applyTheme(isDark())
  }, [])

  const setTheme = useCallback((next: boolean, origin?: WipeOrigin) => {
    const root = document.documentElement
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || typeof document.startViewTransition !== "function") {
      applyTheme(next)
      return
    }
    if (origin) root.dataset.wipe = ""
    const vt = document.startViewTransition(async () => {
      applyTheme(next)
      // Let React render the new state before the browser takes the "after" picture. A timer, not a
      // requestAnimationFrame: rendering is paused while a transition starts, so a frame callback would never fire.
      await new Promise<void>((r) => setTimeout(r, 0))
    })
    if (origin) {
      vt.ready.then(() => {
        const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y))
        root.animate(
          { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
          { duration: 850, easing: "cubic-bezier(.65, 0, .35, 1)", pseudoElement: "::view-transition-new(root)" },
        )
      })
      vt.finished.finally(() => delete root.dataset.wipe)
    }
  }, [])

  return { dark, setTheme }
}

/** Scales a fixed-size stage to the viewport. Writes `varName` on <html>; the stage's CSS reads it. */
export function useStageFit(stageW: number, size: number, varName: string, gutter = 112) {
  useEffect(() => {
    const fit = () => {
      const s = Math.min(1, (window.innerWidth - gutter) / stageW) * size
      document.documentElement.style.setProperty(varName, s.toFixed(3))
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [stageW, size, varName, gutter])
}

/** Gentle pointer parallax: sets --ry / --rx (degrees) on the element, around the given resting angles. */
export function useParallax(ref: RefObject<HTMLElement | null>, opts: { ry: number; rx0: number; rx: number }) {
  useEffect(() => {
    const el = ref.current
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!el || !fine || reduce) return
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      el.style.setProperty("--ry", `${(nx * opts.ry).toFixed(2)}deg`)
      el.style.setProperty("--rx", `${(opts.rx0 - ny * opts.rx).toFixed(2)}deg`)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [ref, opts.ry, opts.rx0, opts.rx])
}
