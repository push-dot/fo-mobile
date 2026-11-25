const listeners = new Set<() => void>()

export const onSessionCleared = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const runSessionCleared = () => {
  for (const fn of listeners) fn()
}
