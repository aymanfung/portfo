import type { ReactNode } from "react"
import { EyeToggle } from "@/components/site/EyeToggle"
import { HotelKeyToggle } from "@/components/site/HotelKeyToggle"
import { TaxiToggle } from "@/components/site/TaxiToggle"

/**
 * A page of every light/dark toggle that has been built, each one live. They all drive the same theme (the `.dark`
 * class on <html>), so using any of them changes the whole page and the others follow along.
 * It is its own entry in the Vite build (toggles.html), so it is not part of the portfolio page.
 */
const TOGGLES: { name: string; live?: boolean; note: string; demo: ReactNode }[] = [
  {
    name: "Hotel key card",
    live: true,
    note: "The one on the portfolio. Slot the key card into the wall switch for light, pull it out to cut the power. Click the plate, or drag the card into the slot (it glows when lined up).",
    demo: <HotelKeyToggle />,
  },
  {
    name: "Hong Kong taxi",
    note: "The first one: the red-lettered light box and its red 空車 FOR HIRE disc. Click the disc and it folds flat into its tray, the lamp goes out and the page goes dark.",
    demo: <TaxiToggle variant="hongkong" />,
  },
  {
    name: "London black cab",
    note: "The black-cab light: lit orange for light mode; click it and it switches off for dark mode.",
    demo: <TaxiToggle variant="london" />,
  },
  {
    name: "New York rooflight",
    note: "TAXI lit for light mode; click and the cab goes OFF DUTY, so TAXI goes dark and the OFF DUTY panels light up.",
    demo: <TaxiToggle variant="newyork" />,
  },
  {
    name: "Eye tracker",
    note: "A little creature that follows your cursor. Click it: it morphs, blinks, and the new theme wipes out from its eye.",
    demo: <EyeToggle />,
  },
]

const mono = "font-mono text-[0.68rem] tracking-[0.18em] uppercase"

export function TogglesGallery() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="/" className={`${mono} text-muted-foreground transition-colors hover:text-foreground`}>
        ← Portfolio
      </a>
      <h1 className="mt-6 text-2xl font-medium sm:text-3xl">Light / dark toggles</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Every switch I have tried for the theme, live. They all control the same theme, so use any one of them and the page
        (and the other switches) follow.
      </p>

      {TOGGLES.map((t, i) => (
        <section key={t.name} className="mt-10 border-t border-border pt-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className={`${mono} text-foreground`}>
              <span className="text-muted-foreground">0{i + 1}</span> · {t.name}
            </h2>
            {t.live ? <span className={`${mono} rounded-full border border-border px-2.5 py-1 text-muted-foreground`}>On the site</span> : null}
          </div>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t.note}</p>
          <div className="-mx-5 pt-2 pb-6">{t.demo}</div> {/* full width: the toggles size themselves from the screen, not from this padded column */}
        </section>
      ))}
    </main>
  )
}
