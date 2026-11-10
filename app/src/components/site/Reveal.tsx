import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { useInView } from "@/hooks/use-in-view"

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ className, ...props }: ComponentProps<"div">) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      {...props}
    />
  )
}
