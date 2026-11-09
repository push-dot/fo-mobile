export const createUndo = (commit: (id: string) => void, ms: number) => {
  let pending: { id: string; timer: ReturnType<typeof setTimeout> } | null = null
  const cancel = () => {
    if (pending) clearTimeout(pending.timer)
    pending = null
  }
  const flush = () => {
    const last = pending
    cancel()
    if (last) commit(last.id)
  }
  const start = (id: string) => {
    flush()
    pending = { id, timer: setTimeout(flush, ms) }
  }
  return { start, cancel, flush, busy: () => pending !== null }
}
