import { useCallback, useState } from "react"
import { Scanner } from "@/components/scanner/Scanner"
// import { AirplaneWindow } from "@/components/site/AirplaneWindow" // hidden for now
import { SiteDock } from "@/components/site/SiteDock"
import { FlightPlan } from "@/components/site/FlightPlan"
import { HotelKeyToggle } from "@/components/site/HotelKeyToggle"
import { EyeToggle } from "@/components/site/EyeToggle"
// import { TaxiToggle } from "@/components/site/TaxiToggle" // kept: taxi-light dark-mode toggles (london / newyork)
import { Masthead } from "@/components/site/Masthead"
import { About, Contact } from "@/components/site/Outro"
import { cn } from "@/lib/utils"

export default function App() {
  const [boarded, setBoarded] = useState(false)

  const goToGate = useCallback(() => {
    window.scrollTo(0, 0)
    setBoarded(false)
  }, [])

  return (
    <>
      <Scanner visible={!boarded} onBoarded={() => setBoarded(true)} />

      <div
        className={cn("transition-all duration-700 ease-out", boarded ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
        inert={!boarded}
      >
        <main>
          <Masthead />
          {/* Hidden for now: <AirplaneWindow /> (component and its dark styling are kept) */}
          <HotelKeyToggle />
          <EyeToggle />
          {/* Alternatives kept: <TaxiToggle variant="london" /> or <TaxiToggle variant="newyork" /> */}

          <section className="mx-auto mt-12 max-w-xl px-5 text-center">
            <p className="text-xl font-medium sm:text-2xl">Senior Product Designer</p>
            <p className="mt-2 text-lg text-balance text-muted-foreground sm:text-xl">
              Designing and leading product across travel-tech, marketplaces, and booking flows — turning complex
              transactions into calm, confident experiences that move numbers.
            </p>
          </section>

          <FlightPlan />
          <About />
          <Contact />
        </main>
      </div>

      {/* outside the animated wrapper: a transformed ancestor would stop `fixed` from pinning to the viewport */}
      <div className={cn("transition-opacity duration-700", boarded ? "opacity-100" : "pointer-events-none opacity-0")} inert={!boarded}>
        <SiteDock onReturnToGate={goToGate} />
      </div>
    </>
  )
}
