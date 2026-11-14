export type AppearKind = 'up' | 'bubble' | 'fade'

/** Entry timing per kind: fade 250ms, rise 300ms, bubble pop 400ms. */
export const appearMs = (kind: AppearKind, duration?: number) => duration ?? (kind === 'bubble' ? 400 : kind === 'fade' ? 250 : 300)

/** The pop starts 18pt low and 6 % small, the rise 10pt low. A fade does not move. */
export const appearFrom = (kind: AppearKind) => ({ dy: kind === 'bubble' ? 18 : 10, scale: kind === 'bubble' ? 0.94 : 1 })

/**
 * The transform entry exists for the whole life of a moving row: `useReduceMotion()` starts false and turns true after mount, and a
 * transform that leaves the style once the native timing has started stays detached at its last frame (scale .94, 18pt low) while
 * opacity keeps running. Reduce Motion is therefore handled by the value, never by the style: see `playAppear`.
 */
export const appearMoves = (kind: AppearKind, still: boolean) => kind !== 'fade' && !still

/**
 * Plays the entry, or lands it: a row that is still, or that Reduce Motion reaches (before or after the timing started), is at its
 * end value at once. Returns the cleanup that stops a running timing.
 */
export const playAppear = (value: { setValue: (v: number) => void }, opts: { still: boolean; reduce: boolean }, start: () => { stop: () => void }) => {
  if (opts.still) return undefined
  if (opts.reduce) {
    value.setValue(1)
    return undefined
  }
  const timing = start()
  return () => timing.stop()
}
