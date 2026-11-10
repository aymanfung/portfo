/** Centred identity block: name, place, coordinates, time zone. */
export function Masthead() {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-10 text-center font-mono text-sm tracking-[0.18em] uppercase">
      <h1 className="font-medium text-foreground">Matthew Au-Yeung</h1>
      <p className="text-muted-foreground">London, UK</p>
      <p className="text-muted-foreground">51.5072° N, 0.1276° W</p>
      <p className="text-muted-foreground">GMT+0</p>
    </div>
  )
}
