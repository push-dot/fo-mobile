import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import type { SectionKind } from '@/features/jobs'
import { useSession } from '@/shared/infrastructure'
import { onSessionCleared } from '@/shared/utility/session-reset'
import { createSnapshotPersistGate, persistHomeSnapshotIfCurrent } from './utils/snapshot-persist'
import { hydrateHomeQueries } from './utils/snapshot-hydrate'
import { isHomeQueryKey, removeHomeQueries } from './utils/snapshot-query-keys'
import { clearHomeSnapshot, readHomeSnapshot } from './utils/snapshot-store'

export const useHomeSections = (): SectionKind[] => ['latest', 'deadline', 'popular']

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

const useHydrated = create<{ userId: string | null; unread: number }>(() => ({ userId: null, unread: 0 }))
onSessionCleared(() => useHydrated.setState({ userId: null, unread: 0 }))
export const useSeededUnread = () => useHydrated((s) => s.unread)

export const useHomeSnapshotReady = () => {
  const userId = useSession((s) => s.session?.user.id ?? null)
  const hydratedUser = useHydrated((s) => s.userId)
  return !userId || hydratedUser === userId
}

export const useHomeSnapshotSync = () => {
  const qc = useQueryClient()
  const userId = useSession((s) => s.session?.user.id ?? null)
  const ready = useHomeSnapshotReady()
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const gate = useRef(createSnapshotPersistGate(() => useSession.getState().session?.user.id))

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
      useHydrated.setState({ userId, unread: snapshot?.unreadCount ?? 0 })
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
