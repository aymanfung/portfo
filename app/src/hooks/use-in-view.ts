import { useEffect, useRef, useState } from "react"

/** True once the element has scrolled into view (and stays true). Respects reduced motion. */
export function useInView<T extends Element>(threshold = 0.12) {
  const ref = useRef<T>(null)
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const [inView, setInView] = useState(reduce)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, reduce])

  return [ref, inView] as const
}
