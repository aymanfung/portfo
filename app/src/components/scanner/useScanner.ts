import { useCallback, useEffect, useRef, useState } from "react"

/** Idle → dragging/scrolling → success. Success hands control back via onBoarded after a short beat. */
type Mode = "idle" | "dragging" | "scrolling" | "success"

const IDLE_TEXT = "Now boarding"
const SUCCESS_TEXT = "Cleared for\ntake-off ✓"
const BOARD_DELAY = 1500 // let the green light register before the page changes
const DESIGN_W = 420 // the 3D scene lives in a fixed 420×700 box that is scaled to fit
const DESIGN_H = 700
const SLIDE = 1.14 // drag px → px of travel along the scanner's slot

interface Options {
  /** Gate is on screen. Turning it back on resets the scanner. */
  visible: boolean
  onBoarded: () => void
}

/**
 * Behaviour of the ticket scanner: drag the phone up (or scroll down) into the slot.
 *  - the red light comes on as soon as the phone starts moving
 *  - dragging only boards once you let go at the top; scrolling boards the moment it reaches the top
 *  - Enter boards immediately
 */
export function useScanner({ visible, onBoarded }: Options) {
  const fitRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const engagedRef = useRef(false)

  const [engaged, setEngaged] = useState(false) // phone has been touched/scrolled: stop the idle hint
  const [near, setNear] = useState(false)
  const [success, setSuccess] = useState(false)
  const [status, setStatus] = useState(IDLE_TEXT)

  // mutable gesture state (not rendered)
  const s = useRef({
    mode: "idle" as Mode,
    dy: 0,
    k: 1,
    startY: 0,
    startDy: 0,
    wheelTimer: 0 as number | undefined,
    boardTimer: 0 as number | undefined,
  })
  const onBoardedRef = useRef(onBoarded)
  useEffect(() => {
    onBoardedRef.current = onBoarded
  }, [onBoarded])

  const targetDy = () => -140 * s.current.k

  const setPhone = useCallback((v: number) => {
    if (!phoneRef.current) return
    // the further up the slot it goes, the further away it looks: shrink toward the far end (about -20% at the top)
    const progress = Math.max(0, Math.min(1, v / targetDy()))
    const size = 1 - 0.2 * progress
    phoneRef.current.style.transform = `translateY(${(v / s.current.k) * SLIDE}px) scale(${size.toFixed(4)})`
    // how far up the slot it is, 0..1, for the guide chevrons (they light up in step with the drag; see scanner.css)
    fitRef.current?.style.setProperty("--p", progress.toFixed(3))
  }, [])

  const setTransition = (value: string) => {
    if (phoneRef.current) phoneRef.current.style.transition = value
  }

  /** First touch/scroll: stop the idle hint (the phone eases to rest via CSS, see .phone3d--still). */
  const engage = useCallback(() => {
    if (engagedRef.current) return
    engagedRef.current = true
    setEngaged(true)
  }, [])

  const reset = useCallback(() => {
    const st = s.current
    window.clearTimeout(st.wheelTimer)
    window.clearTimeout(st.boardTimer)
    st.mode = "idle"
    st.dy = 0
    engagedRef.current = false
    setEngaged(false)
    setNear(false)
    setSuccess(false)
    setStatus(IDLE_TEXT)
    setPhone(0)
  }, [setPhone])

  const celebrate = useCallback(() => {
    const st = s.current
    if (st.mode === "success") return
    st.mode = "success"
    setNear(false)
    setSuccess(true)
    setStatus(SUCCESS_TEXT)
    st.boardTimer = window.setTimeout(() => onBoardedRef.current(), BOARD_DELAY)
  }, [])

  /** red light + wording while the phone is on its way up */
  const updateProgress = useCallback(() => {
    const st = s.current
    // the red light is on the moment the phone is held (dragging), and while it is scrolled up the slot
    const isNear = st.mode === "dragging" || st.dy < -2
    setNear(isNear)
    if (!isNear) setStatus(IDLE_TEXT)
    else if (st.mode === "dragging" && st.dy <= targetDy() * 0.86) setStatus("Release to\ntake off")
    else setStatus("Scanning…")
  }, [])

  /** finger/mouse lifted, or scrolling paused */
  const release = useCallback(() => {
    const st = s.current
    setTransition("transform .5s cubic-bezier(0.22, 1, 0.36, 1)")
    if (st.dy <= targetDy() * 0.86) {
      st.dy = targetDy()
      setPhone(st.dy)
      celebrate()
      return
    }
    reset()
  }, [celebrate, reset, setPhone])

  // fit the fixed design box to the viewport (contain), never distorting it
  useEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - 24
      const capH = captionRef.current?.offsetHeight ?? 24
      const availH = window.innerHeight - (capH + 150) // leaves breathing room above the caption and below the phone
      const k = Math.max(0.35, Math.min(1.3, availW / DESIGN_W, availH / DESIGN_H))
      s.current.k = k
      fitRef.current?.style.setProperty("--k", k.toFixed(4))
      if (s.current.mode === "idle") setPhone(0)
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [setPhone])

  // coming back to the gate (e.g. via the brand link) starts fresh
  useEffect(() => {
    if (visible) {
      setTransition("none")
      reset()
      const id = window.setTimeout(() => setTransition(""), 80)
      return () => window.clearTimeout(id)
    }
  }, [visible, reset])

  // drag, scroll, Enter
  useEffect(() => {
    if (!visible) return
    const st = s.current

    const onMove = (e: PointerEvent) => {
      if (st.mode !== "dragging") return
      st.dy = Math.min(30, Math.max(targetDy(), st.startDy + (e.clientY - st.startY)))
      setPhone(st.dy)
      updateProgress()
    }
    const onUp = () => {
      if (st.mode === "dragging") release()
    }
    const onWheel = (e: WheelEvent) => {
      if (st.mode === "success" || st.mode === "dragging") return
      e.preventDefault()
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      st.mode = "scrolling"
      engage()
      setTransition("none")
      st.dy = Math.min(0, Math.max(targetDy(), st.dy - delta * 0.5 * st.k))
      setPhone(st.dy)
      window.clearTimeout(st.wheelTimer)
      if (st.dy <= targetDy() + 0.5) {
        // scrolled all the way up → green straight away
        celebrate()
        return
      }
      updateProgress()
      st.wheelTimer = window.setTimeout(() => {
        if (st.mode === "scrolling") release()
      }, 320)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || st.mode === "success") return
      engage()
      setTransition("transform .3s cubic-bezier(0.22, 1, 0.36, 1)")
      st.dy = targetDy()
      setPhone(st.dy)
      celebrate()
    }

    window.addEventListener("pointermove", onMove)
    const clearGrab = () => document.documentElement.removeAttribute("data-grabbing")
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    window.addEventListener("pointerup", clearGrab)
    window.addEventListener("pointercancel", clearGrab)
    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointerup", clearGrab)
      window.removeEventListener("pointercancel", clearGrab)
      clearGrab()
      window.removeEventListener("pointercancel", onUp)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
    }
  }, [visible, celebrate, engage, release, setPhone, updateProgress])

  const onPhonePointerDown = useCallback((e: React.PointerEvent) => {
    const st = s.current
    if (st.mode !== "idle") return
    st.mode = "dragging"
    document.documentElement.setAttribute("data-grabbing", "") // one steady closed-hand cursor, wherever the pointer is while the phone lags behind it
    engage()
    st.startY = e.clientY
    st.startDy = st.dy
    setTransition("none")
    updateProgress() // red light on right away, not only once it has moved
    e.preventDefault()
  }, [engage, updateProgress])

  return { fitRef, phoneRef, captionRef, idle: !engaged, near, success, status, onPhonePointerDown }
}
