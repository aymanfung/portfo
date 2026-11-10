import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Reveal } from "./Reveal"

const EMAIL = "hello@yoursite.com"

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto mt-28 max-w-2xl scroll-mt-8 px-5 sm:px-8">
      <Separator />
      <Reveal className="flex flex-col gap-5 pt-16">
        <h2 id="about-heading" className="font-mono text-[0.68rem] font-medium tracking-[0.2em] text-brand uppercase">
          About
        </h2>
        <p className="text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl">
          I'm a senior product designer who owns and leads design from the first problem to the shipped, measured
          product.
        </p>
        <div className="flex flex-col gap-4 text-lg text-muted-foreground">
          <p>
            [Differentiator — add your one line here, e.g. "I tie every design decision back to revenue and retention."]
          </p>
          <p>[Approach — research, systems, and close collaboration with product and engineering. Add your own words.]</p>
        </div>
      </Reveal>
    </section>
  )
}

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="mx-auto mt-28 max-w-2xl scroll-mt-8 px-5 pb-40 sm:px-8">
      <Separator />
      <Reveal className="flex flex-col items-center gap-6 pt-16 text-center">
        <p id="contact-heading" className="font-mono text-[0.68rem] tracking-[0.2em] text-brand uppercase">
          Final stop
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Thank you for flying. See you again soon.
        </h2>
        <p className="max-w-md text-lg text-muted-foreground">Looking for a senior product designer who ships?</p>
        <Button size="lg" asChild>
          <a href={`mailto:${EMAIL}`}>
            {EMAIL}
            <ArrowRightIcon data-icon="inline-end" />
          </a>
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Button variant="link" asChild>
            <a href="#">LinkedIn</a>
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button variant="link" asChild>
            <a href="#">Dribbble</a>
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
