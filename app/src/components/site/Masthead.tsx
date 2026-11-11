/** Centred identity block: name and place. */
export function Masthead() {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-10 text-center font-mono text-sm tracking-[0.18em] uppercase">
      <h1 className="font-medium text-foreground">Matthew Au-Yeung</h1>
      <p className="text-muted-foreground">London, UK</p>
    </div>
  )
}
