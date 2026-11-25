export type AppearKind = 'up' | 'bubble' | 'fade'

export const appearMs = (kind: AppearKind, duration?: number) => duration ?? (kind === 'bubble' ? 400 : kind === 'fade' ? 250 : 300)

export const appearFrom = (kind: AppearKind) => ({ dy: kind === 'bubble' ? 18 : 10, scale: kind === 'bubble' ? 0.94 : 1 })

export const appearMoves = (kind: AppearKind, still: boolean) => kind !== 'fade' && !still

export const playAppear = (value: { setValue: (v: number) => void }, opts: { still: boolean; reduce: boolean }, start: () => { stop: () => void }) => {
  if (opts.still) return undefined
  if (opts.reduce) {
    value.setValue(1)
    return undefined
  }
  const timing = start()
  return () => timing.stop()
}
