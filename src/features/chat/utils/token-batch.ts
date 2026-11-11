export const createTokenBatch = (
  flush: (id: string, text: string) => void,
  schedule: (run: () => void) => void,
) => {
  const pending = new Map<string, string>()
  const armed = new Set<string>()
  const flushId = (id: string) => {
    armed.delete(id)
    const text = pending.get(id)
    pending.delete(id)
    if (text) flush(id, text)
  }
  return {
    push(id: string, text: string) {
      pending.set(id, (pending.get(id) ?? '') + text)
      if (armed.has(id)) return
      armed.add(id)
      schedule(() => flushId(id))
    },
    flushNow(id: string) {
      flushId(id)
    },
  }
}
