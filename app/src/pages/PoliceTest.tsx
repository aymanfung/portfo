import { useState } from "react"
import { LostKeyCards } from "@/components/site/LostKeyCards"
import "@/components/site/lost-key-cards.css"

/** TEST PAGE for the lost key cards scene (the same component that is on the portfolio), with a Reset button. Own entry in the Vite build (police.html). */
export function PoliceTest() {
  const [restock, setRestock] = useState(0)
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="/toggles.html" className="font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase hover:text-foreground">← Toggles</a>
      <h1 className="mt-6 text-2xl font-medium sm:text-3xl">Lost key cards (test)</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        You only get 3 cards. Drag one off the plate and let go to throw it away. Throw them all and the phone rings.
      </p>
      <div className="mt-4">
        <button type="button" className="pt-btn" onClick={() => setRestock((r) => r + 1)}>Reset test</button>
      </div>
      <div className="-mx-5 pt-2 pb-40">
        <LostKeyCards restockToken={restock} />
      </div>
    </main>
  )
}
