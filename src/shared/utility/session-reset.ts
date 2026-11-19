const listeners = new Set<() => void>()

/** Registers what must forget the signed-in user's data when the session ends. Returns the unregister. */
export const onSessionCleared = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const runSessionCleared = () => {
  for (const fn of listeners) fn()
}
