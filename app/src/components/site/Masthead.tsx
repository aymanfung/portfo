/** Centred identity block: name and place. Hovering (or focusing) the surname shows a speech bubble with how to say it. */
export function Masthead() {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-10 text-center font-mono text-sm tracking-[0.18em] uppercase">
      <h1 className="font-medium text-foreground">
        Matthew{" "}
        <span
          tabIndex={0}
          aria-describedby="surname-pronunciation"
          className="group relative inline-block cursor-help outline-none"
        >
          Au-Yeung
          <span
            id="surname-pronunciation"
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl bg-foreground px-3 py-1.5 text-xs font-normal tracking-normal text-background normal-case opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
          >
            Pronounced “Owl Young”
            <span
              aria-hidden="true"
              className="absolute top-full left-1/2 -mt-1 size-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-foreground"
            />
          </span>
        </span>
      </h1>
      <p className="text-muted-foreground">London, UK</p>
    </div>
  )
}
