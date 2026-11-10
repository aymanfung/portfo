import { useEffect, useRef } from "react"

/**
 * Drives a scroll-linked timeline: sets --progress (px) on the container and marks each
 * `[data-node]` as active once the line has passed it. Works imperatively so scrolling never re-renders React.
 */
export function useTimelineProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const progress = Math.max(0, Math.min(rect.height, window.innerHeight * 0.6 - rect.top))
      el.style.setProperty("--progress", `${progress}px`)
      el.querySelectorAll<HTMLElement>("[data-node]").forEach((node) => {
        const y = node.getBoundingClientRect().top - rect.top
        node.dataset.active = y <= progress ? "true" : "false"
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return ref
}
