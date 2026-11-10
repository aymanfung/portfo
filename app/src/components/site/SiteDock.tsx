import { DoorOpenIcon, HouseIcon, MailIcon, PlaneIcon, UserIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { MagnifyingDock, type DockItem } from "@/components/ui/magnifying-dock"

type SectionId = "top" | "log" | "about" | "contact"

const ITEMS: DockItem[] = [
  { key: "top", label: "Home", Icon: HouseIcon },
  { key: "log", label: "Flight plan", Icon: PlaneIcon },
  { key: "about", label: "About", Icon: UserIcon },
  { key: "contact", label: "Contact", Icon: MailIcon },
  { key: "gate", label: "Return to gate", Icon: DoorOpenIcon },
]

interface SiteDockProps {
  /** Go back to the boarding-gate scanner. */
  onReturnToGate: () => void
}

/** The site's navigation, in Bencho's magnifying dock: scrolls to a section, or returns to the gate. */
export function SiteDock({ onReturnToGate }: SiteDockProps) {
  const [active, setActive] = useState<SectionId>("top")

  // which section is under the reading line
  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.45
      let current: SectionId = "top"
      for (const id of ["log", "about", "contact"] as const) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      // at the very bottom the last section always wins
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = "contact"
      setActive(current)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const select = (key: string) => {
    if (key === "gate") onReturnToGate()
    else if (key === "top") window.scrollTo({ top: 0, behavior: "smooth" })
    else document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    // data-surface="glass" switches on the dock's frosted rim and floating shadow
    <div data-surface="glass" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto">
        <MagnifyingDock items={ITEMS} active={active} onSelect={select} />
      </div>
    </div>
  )
}
