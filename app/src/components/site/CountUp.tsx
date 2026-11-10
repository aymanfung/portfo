import { useEffect, useState } from "react"

interface CountUpProps {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
}

/** Counts from 0 to `to` when it mounts (e.g. when an accordion item opens). */
export function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1300 }: CountUpProps) {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const [value, setValue] = useState(reduce ? to : 0)

  useEffect(() => {
    if (reduce) return
    let raf = 0
    let start: number | null = null
    const step = (ts: number) => {
      if (start === null) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setValue(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, duration, reduce])

  return (
    <>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </>
  )
}
