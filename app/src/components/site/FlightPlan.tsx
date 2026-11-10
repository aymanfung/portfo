import { ArrowUpRightIcon, PlaneIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTimelineProgress } from "@/hooks/use-timeline-progress"
import { CountUp } from "./CountUp"
import { Reveal } from "./Reveal"

interface Stat {
  to: number
  prefix?: string
  suffix?: string
  decimals?: number
  label: string
}
interface Project {
  name: string
  note: string
}
interface Leg {
  id: string
  route: string
  current?: boolean
  title: string
  role: string
  description: string
  stats?: Stat[]
  projects: Project[]
}

const LEGS: Leg[] = [
  {
    id: "01",
    route: "LON → 20XX",
    current: true,
    title: "TravelTech Company",
    role: "Senior Product Designer",
    description:
      "Own and lead design end-to-end for the core booking and marketplace experience, from problem framing to shipped, measured product.",
    stats: [
      { to: 18, prefix: "+", suffix: "%", label: "booking completion" },
      { to: 4.2, decimals: 1, suffix: "×", label: "faster checkout" },
    ],
    projects: [
      { name: "Project A", note: "Marketplace checkout & payment flows" },
      { name: "Project B", note: "Design system for the booking platform" },
    ],
  },
  {
    id: "02",
    route: "LON → 20XX",
    title: "Marketplace Start-up",
    role: "Product Designer",
    description: "Led design for search, discovery, and personalization in a fast-moving marketplace.",
    stats: [{ to: 31, prefix: "+", suffix: "%", label: "search → detail" }],
    projects: [{ name: "Project C", note: "Search & discovery re-architecture" }],
  },
  {
    id: "03",
    route: "LON → 20XX",
    title: "Digital Agency",
    role: "Designer",
    description: "Shipped my first products across startup and enterprise clients, honing craft and process.",
    projects: [{ name: "Project D", note: "A native mobile experience" }],
  },
]

/** "Flight plan": a dashed route drops from the plane into a scroll-linked timeline. */
export function FlightPlan() {
  const timelineRef = useTimelineProgress<HTMLDivElement>()

  return (
    <section id="log" aria-labelledby="flight-plan-heading" className="mx-auto mt-24 max-w-2xl scroll-mt-8 px-5 sm:px-8">
      <div className="flex flex-col items-center gap-2">
        <h2
          id="flight-plan-heading"
          className="font-mono text-[0.68rem] font-medium tracking-[0.2em] text-brand uppercase"
        >
          Flight plan
        </h2>
        <PlaneIcon className="size-6 rotate-[135deg] fill-brand text-brand" aria-hidden="true" />
      </div>

      {/* dashed route: down from the plane, across, and onto the timeline line */}
      <div className="relative -mt-1 h-28" aria-hidden="true">
        <svg
          className="absolute top-0 right-1/2 h-full overflow-visible text-brand/40"
          style={{ left: "11px" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 100 0 V 28 Q 100 50 78 50 H 22 Q 0 50 0 72 V 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div
        ref={timelineRef}
        className="relative pl-12 [--progress:0px]"
      >
        {/* track + progress fill */}
        <div className="absolute top-0 bottom-0 left-[11px] w-px border-l border-dashed border-border" aria-hidden="true" />
        <div
          className="absolute top-0 left-[11px] w-0.5 -translate-x-1/2 rounded-full bg-brand"
          style={{ height: "var(--progress)" }}
          aria-hidden="true"
        />

        <ol className="flex flex-col gap-16 pb-4">
          {LEGS.map((leg) => (
            <li key={leg.id} className="relative">
              <span
                data-node
                data-active="false"
                aria-hidden="true"
                className="absolute top-2 -left-12 flex size-[22px] items-center justify-center rounded-full border border-border bg-background transition-colors duration-300 data-[active=true]:border-brand data-[active=true]:bg-brand/10"
              >
                <span className="size-2 rounded-full bg-border transition-colors duration-300 in-data-[active=true]:bg-brand" />
              </span>

              <Reveal className="flex flex-col gap-3">
                <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  Leg {leg.id} · {leg.route}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-semibold tracking-tight">{leg.title}</h3>
                  {leg.current && <Badge className="bg-brand text-white">Current</Badge>}
                </div>
                <p className="text-lg font-medium">{leg.role}</p>
                <p className="text-lg text-muted-foreground">{leg.description}</p>

                {leg.stats && (
                  <ul className="flex flex-wrap gap-x-8 gap-y-3 pt-1">
                    {leg.stats.map((stat) => (
                      <li key={stat.label}>
                        <span className="text-3xl font-semibold tracking-tight tabular-nums">
                          <CountUp to={stat.to} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                        </span>
                        <span className="block text-xs text-muted-foreground">{stat.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <ul className="mt-2 flex flex-col gap-2">
                  {leg.projects.map((project) => (
                    <li key={project.name}>
                      <a
                        href="#"
                        className="group flex items-center gap-4 rounded-xl p-2 -mx-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span
                          aria-hidden="true"
                          className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-secondary to-muted font-mono text-xs text-muted-foreground ring-1 ring-foreground/10"
                        >
                          {project.name.slice(-1)}
                        </span>
                        <span className="flex-1">
                          <span className="block font-medium">{project.name}</span>
                          <span className="block text-sm text-muted-foreground">{project.note}</span>
                        </span>
                        <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
