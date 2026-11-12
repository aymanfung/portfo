/** Tiny sound-effect player. Files live in public/sounds (Kenney, CC0). */
/** Master volume: every sound is played at its own volume times this. */
export const MASTER_VOLUME = 0.5

const cache = new Map<string, HTMLAudioElement>()

export function playSound(name: string, volume = 0.6) {
  try {
    let base = cache.get(name)
    if (!base) {
      base = new Audio(`${import.meta.env.BASE_URL}sounds/${name}.wav`)
      base.preload = "auto"
      cache.set(name, base)
    }
    // A clone, so quick repeats overlap instead of cutting each other off.
    const a = base.cloneNode() as HTMLAudioElement
    a.volume = clamp01(volume * MASTER_VOLUME)
    void a.play().catch(() => {}) // autoplay rules: ignored until the user has interacted
  } catch {
    /* no audio available */
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
