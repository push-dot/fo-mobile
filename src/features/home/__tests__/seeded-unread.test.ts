import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { runSessionCleared } from '@/shared/utility/session-reset'
import { HOME_SNAPSHOT_VERSION } from '../constants'
import type { HomeSnapshot } from '../types'

const h = vi.hoisted(() => ({ qc: null as QueryClient | null }))

vi.mock('react', () => ({ useEffect: (fn: () => unknown) => void fn(), useRef: <T>(current: T) => ({ current }) }))
vi.mock('zustand', async () => {
  const { createStore } = await import('zustand/vanilla')
  return {
    create: <S>(init: () => S) => {
      const store = createStore(init)
      return Object.assign(<T>(select: (state: S) => T) => select(store.getState()), store)
    },
  }
})
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => h.qc,
}))
vi.mock('@/shared/infrastructure', async () => {
  const { create } = await import('zustand')
  return { useSession: create(() => ({ session: { user: { id: 'u1' } } })) }
})
vi.mock('../utils/snapshot-store', () => ({
  clearHomeSnapshot: vi.fn(),
  writeHomeSnapshot: vi.fn(),
  readHomeSnapshot: vi.fn(
    async (): Promise<HomeSnapshot> => ({
      version: HOME_SNAPSHOT_VERSION,
      savedAt: 1,
      sections: { latest: [], deadline: [], popular: [] },
      unreadCount: 4,
    }),
  ),
}))

const { useHomeSnapshotReady, useHomeSnapshotSync, useSeededUnread } = await import('../hooks')

describe('seeded unread count', () => {
  it('carries the snapshot count until sign-out clears it', async () => {
    h.qc = new QueryClient()
    useHomeSnapshotSync()
    await vi.waitFor(() => expect(useHomeSnapshotReady()).toBe(true))
    expect(useSeededUnread()).toBe(4)
    expect(h.qc.getQueryData(['notifications'])).toBeUndefined()
    runSessionCleared()
    expect(useSeededUnread()).toBe(0)
    expect(useHomeSnapshotReady()).toBe(false)
  })
})
