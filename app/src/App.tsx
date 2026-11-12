import { useCallback, useState } from "react"
import { Scanner } from "@/components/scanner/Scanner"
// import { AirplaneWindow } from "@/components/site/AirplaneWindow" // hidden for now
import { SiteDock } from "@/components/site/SiteDock"
import { FlightPlan } from "@/components/site/FlightPlan"
import { LostKeyCards } from "@/components/site/LostKeyCards"
// import { EyeToggle } from "@/components/site/EyeToggle" // removed from the page for now (component kept)
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
          <LostKeyCards bottomOffset={92} />
          {/* Alternatives kept: <TaxiToggle variant="london" /> or <TaxiToggle variant="newyork" /> or <EyeToggle /> */}

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
      {/* The dock fades in by its OWN opacity (see [data-dock-fade] in index.css), not by this wrapper's: a frosted-glass element only blurs
          what is behind it up to the nearest ancestor that is part-transparent, so a fading wrapper made the blur pop in only once the
          fade had finished. */}
      <div data-dock-fade data-shown={boarded} className={boarded ? "" : "pointer-events-none"} inert={!boarded}>
        <SiteDock onReturnToGate={goToGate} />
      </div>
    </>
  )
}
