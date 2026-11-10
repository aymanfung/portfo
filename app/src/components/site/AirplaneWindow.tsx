import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * An illustrated cabin window: sky and drifting clouds behind a rounded pane, with a pull-down shade.
 * The shade is a real button, so it works with keyboard and screen readers.
 */
export function AirplaneWindow() {
  const [closed, setClosed] = useState(false)

  return (
    <div className="mx-auto mt-10 w-[min(15.5rem,62vw)]">
      {/* outer cabin wall + rim */}
      <div className="rounded-[46%/38%] bg-linear-to-b from-[#fbf8f4] via-[#ece6df] to-[#d9d1c8] p-[7%] shadow-[0_18px_40px_-14px_rgba(23,22,15,.35),inset_0_2px_0_rgba(255,255,255,.9),inset_0_-3px_6px_rgba(23,22,15,.12)] dark:from-[#3b3e47] dark:via-[#2d3039] dark:to-[#1f2128] dark:shadow-[0_18px_40px_-14px_rgba(0,0,0,.7),inset_0_2px_0_rgba(255,255,255,.12),inset_0_-3px_6px_rgba(0,0,0,.4)]">
        {/* inner bezel */}
        <div className="rounded-[46%/38%] bg-linear-to-b from-[#cfc7be] to-[#f4f0ea] p-[5%] shadow-[inset_0_2px_5px_rgba(23,22,15,.25)] dark:from-[#111318] dark:to-[#2a2d35] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,.6)]">
          {/* the pane */}
          <button
            type="button"
            onClick={() => setClosed((c) => !c)}
            aria-pressed={closed}
            aria-label={closed ? "Open the window shade" : "Close the window shade"}
            className="group relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[46%/38%] bg-linear-to-b from-[#7db7f2] via-[#b9d9f7] to-[#e9f1fa] outline-none focus-visible:ring-3 focus-visible:ring-ring/60 dark:from-[#070d24] dark:via-[#16255a] dark:to-[#33477f]"
          >
            {/* stars (night only) */}
            <span
              aria-hidden="true"
              className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100 [background-image:radial-gradient(1.5px_1.5px_at_22%_14%,#fff,transparent),radial-gradient(1px_1px_at_68%_22%,#fff,transparent),radial-gradient(1.5px_1.5px_at_44%_30%,#fff,transparent),radial-gradient(1px_1px_at_80%_10%,#fff,transparent),radial-gradient(1px_1px_at_12%_36%,#fff,transparent),radial-gradient(1.5px_1.5px_at_58%_8%,#fff,transparent),radial-gradient(1px_1px_at_88%_34%,#fff,transparent)]"
            />
            {/* clouds */}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[58%] bg-linear-to-t from-white via-white/90 to-transparent dark:from-[#8794bd] dark:via-[#8794bd]/70" />
            <span aria-hidden="true" className="cloud absolute top-[46%] left-[-30%] h-[16%] w-[70%] rounded-full bg-white/90 blur-md [animation-duration:38s] dark:bg-[#aab6d8]/60" />
            <span aria-hidden="true" className="cloud absolute top-[58%] left-[-60%] h-[20%] w-[90%] rounded-full bg-white blur-lg [animation-duration:52s] [animation-delay:-18s] dark:bg-[#9ba8cc]/80" />
            <span aria-hidden="true" className="cloud absolute top-[34%] left-[-20%] h-[9%] w-[40%] rounded-full bg-white/70 blur-sm [animation-duration:30s] [animation-delay:-9s] dark:bg-[#aab6d8]/40" />
            {/* glass sheen */}
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-white/35 via-transparent to-transparent" />

            {/* shade */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 top-0 h-full origin-top bg-linear-to-b from-[#f3eee8] to-[#e4ddd4] dark:from-[#4b4d57] dark:to-[#383a43] shadow-[0_8px_14px_rgba(23,22,15,.25)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                closed ? "translate-y-0" : "-translate-y-[78%] group-hover:-translate-y-[74%]",
              )}
            >
              <span className="absolute inset-x-[30%] bottom-3 h-1.5 rounded-full bg-black/15" />
              <span className="absolute inset-x-[34%] bottom-6 h-px bg-black/10" />
              <span className="absolute inset-x-[34%] bottom-8 h-px bg-black/10" />
            </span>
          </button>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
        {closed ? "Open the window shade" : "Close the window shade"}
      </p>
    </div>
  )
}
