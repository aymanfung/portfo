import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react"

/**
 * While the page cross-fades between light and dark (a view transition), the browser puts its own layers over the document and sends
 * every press to the page's root element instead of to the elements under it: the card and the plate would not respond for the length
 * of the fade. So catch those presses at the window and, if they landed on the card or the plate, do what a press there would have done:
 *  - a pointer-down on the card grabs it (`grab`),
 *  - a click on the plate (the label, the LED, bare metal) flips the switch (`toggle`),
 *  - and the pointer over either keeps its hand cursor.
 */
export function useFadePress(opts: {
  card: RefObject<HTMLElement | null>
  plate: RefObject<HTMLElement | null>
  grab: (e: ReactPointerEvent) => void
  /** Changes whenever the theme changes, which is when a fade starts. */
  watch: unknown
  toggle: () => void
  /** True just after a drag ends, when the click that follows it must not flip the switch. */
  suppressClick: RefObject<boolean>
}) {
  const latest = useRef(opts)
  latest.current = opts // always the newest handlers, without re-adding the listeners every render
  const last = useRef({ x: -1, y: -1, onRoot: false }) // where the pointer last was, and whether the page root was under it
  const applyRef = useRef(() => {})

  useEffect(() => {
    const inside = (el: HTMLElement | null | undefined, x: number, y: number) => {
      const r = el?.getBoundingClientRect()
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    const onDown = (e: PointerEvent) => {
      if (e.target !== document.documentElement) return
      const o = latest.current
      if (inside(o.card.current, e.clientX, e.clientY)) o.grab(e as unknown as ReactPointerEvent)
    }
    const onClick = (e: MouseEvent) => {
      if (e.target !== document.documentElement) return
      const o = latest.current
      if (o.suppressClick.current || !inside(o.plate.current, e.clientX, e.clientY)) return
      o.toggle()
    }
    // During the fade the page root is what is under the pointer, so it would show the ordinary arrow over the plate: keep the hand.
    // (`apply` is also run every frame for a moment when the theme changes, so it holds even if the pointer is not moving.)
    const root = document.documentElement
    const apply = () => {
      const o = latest.current
      const { x, y, onRoot } = last.current
      const over = onRoot && (inside(o.plate.current, x, y) || inside(o.card.current, x, y))
      if (over) root.style.cursor = "pointer"
      else if (root.style.cursor) root.style.removeProperty("cursor")
    }
    const onMove = (e: PointerEvent) => {
      last.current = { x: e.clientX, y: e.clientY, onRoot: e.target === root }
      apply()
    }
    window.addEventListener("pointerdown", onDown, true)
    window.addEventListener("click", onClick, true)
    window.addEventListener("pointermove", onMove, true)
    applyRef.current = apply
    return () => {
      root.style.removeProperty("cursor")
      window.removeEventListener("pointermove", onMove, true)
      window.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("click", onClick, true)
    }
  }, [])

  // A fade has just started (the theme changed): for as long as it can last, re-apply the cursor every frame.
  useEffect(() => {
    let raf = 0
    const end = performance.now() + 1600
    // the page root is what the browser reports under the pointer once the fade starts, even though nothing has moved
    last.current = { ...last.current, onRoot: last.current.x >= 0 }
    const tick = () => {
      applyRef.current()
      if (performance.now() < end) raf = requestAnimationFrame(tick)
      else document.documentElement.style.removeProperty("cursor") // the fade is over: the elements themselves show the hand again
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [opts.watch])
}
