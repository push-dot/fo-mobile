import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { HOME_SNAPSHOT_VERSION } from './constants'
import { collectHomeSnapshotPayload, HYDRATED_QUERY_UPDATED_AT, hydrateHomeQueries } from './hydrate'
import { removeHomeQueries } from './query-keys'
import type { HomeSnapshot } from './types'

const snapshot: HomeSnapshot = {
  version: HOME_SNAPSHOT_VERSION,
  savedAt: 1_700_000_000_000,
  sections: {
    latest: [{ id: 'a', company: 'A', title: 't', imageUrl: null, location: '서울', careerMin: 0, careerMax: null, bookmarked: false }],
    deadline: [{ id: 'b', company: 'B', title: 't2', imageUrl: null, location: '부산', careerMin: 1, careerMax: 2, bookmarked: true }],
    popular: [{ id: 'c', company: 'C', title: 't3', imageUrl: null, location: '대전', careerMin: 3, careerMax: null, bookmarked: false }],
  },
  unreadCount: 4,
}

describe('home snapshot hydrate', () => {
  it('seeds react-query with stale cache rows so a refetch runs', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    hydrateHomeQueries(qc, snapshot)
    expect(qc.getQueryState(['postings', 'home', 'latest'])?.dataUpdatedAt).toBe(HYDRATED_QUERY_UPDATED_AT)
    expect(Date.now() - (qc.getQueryState(['postings', 'home', 'latest'])?.dataUpdatedAt ?? 0)).toBeGreaterThan(30_000)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['postings', 'home'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications'] })
    expect(qc.getQueryData(['notifications'])).toMatchObject({ homeUnread: 4, data: [] })
  })

  it('drops home queries so another user cannot see leftover cache', () => {
    const qc = new QueryClient()
    hydrateHomeQueries(qc, snapshot)
    removeHomeQueries(qc)
    expect(qc.getQueryData(['postings', 'home', 'popular'])).toBeUndefined()
    expect(collectHomeSnapshotPayload(qc)).toBeNull()
  })

  it('collects a trimmed snapshot when every home query has succeeded', () => {
    const qc = new QueryClient()
    hydrateHomeQueries(qc, snapshot)
    expect(collectHomeSnapshotPayload(qc, 99)).toMatchObject({
      savedAt: 99,
      unreadCount: 4,
      sections: { latest: [{ id: 'a' }], popular: [{ id: 'c' }] },
    })
  })
})
