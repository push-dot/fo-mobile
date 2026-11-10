import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/shared/infrastructure'
import { clearHomeSnapshot, readHomeSnapshot } from './snapshot/store'
import { hydrateHomeQueries } from './snapshot/hydrate'
import { isHomeQueryKey, removeHomeQueries } from './snapshot/query-keys'
import { createSnapshotPersistGate, persistHomeSnapshotIfCurrent } from './snapshot/persist'

const schedulePersist = (
  userId: string,
  gate: ReturnType<typeof createSnapshotPersistGate>,
  qc: ReturnType<typeof useQueryClient>,
  timers: Map<string, ReturnType<typeof setTimeout>>,
) => {
  const prev = timers.get(userId)
  if (prev) clearTimeout(prev)
  const generation = gate.currentGeneration()
  timers.set(
    userId,
    setTimeout(() => {
      timers.delete(userId)
      void persistHomeSnapshotIfCurrent(qc, userId, generation, gate)
    }, 400),
  )
}

export const useHomeSnapshotSync = () => {
  const qc = useQueryClient()
  const userId = useSession((s) => s.session?.user.id ?? null)
  const [hydratedUser, setHydratedUser] = useState<string | null>(null)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const gate = useRef(createSnapshotPersistGate(() => useSession.getState().session?.user.id))
  const ready = !userId || hydratedUser === userId

  useEffect(() => {
    return useSession.subscribe((next, prev) => {
      if (next.session) return
      gate.current.bumpGeneration()
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
      removeHomeQueries(qc)
      const id = prev.session?.user.id
      if (id) void clearHomeSnapshot(id)
    })
  }, [qc])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    gate.current.bumpGeneration()
    void (async () => {
      removeHomeQueries(qc)
      const snapshot = await readHomeSnapshot(userId)
      if (cancelled) return
      if (snapshot) hydrateHomeQueries(qc, snapshot)
      if (!cancelled) setHydratedUser(userId)
    })()
    return () => {
      cancelled = true
    }
  }, [qc, userId])

  useEffect(() => {
    if (!userId) return
    return qc.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' && event.type !== 'added') return
      const query = event.query
      if (query.state.status !== 'success') return
      if (!isHomeQueryKey(query.queryKey)) return
      schedulePersist(userId, gate.current, qc, timers.current)
    })
  }, [qc, userId])

  useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
    },
    [],
  )

  return ready
}
