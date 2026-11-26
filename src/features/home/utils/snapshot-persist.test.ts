import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOME_SNAPSHOT_VERSION } from '../constants'
import { hydrateHomeQueries } from './snapshot-hydrate'
import { createSnapshotPersistGate, persistHomeSnapshotIfCurrent } from './snapshot-persist'
import type { HomeSnapshot } from '../types'

const disk = vi.hoisted(() => new Map<string, string>())

vi.mock('expo-file-system', () => {
  const join = (parts: unknown[]) => parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri).replace(/\/$/, '')).join('/')
  class Directory {
    uri: string
    constructor(...parts: unknown[]) {
      this.uri = join(parts)
    }
    create() {}
  }
  class File {
    uri: string
    constructor(...parts: unknown[]) {
      this.uri = join(parts)
    }
    get exists() {
      return disk.has(this.uri)
    }
    async text() {
      return disk.get(this.uri) ?? ''
    }
    async write(contents: string) {
      disk.set(this.uri, contents)
    }
    delete() {
      disk.delete(this.uri)
    }
  }
  return { Directory, File, Paths: { document: new Directory('file:///docs/') } }
})

const snapshot: HomeSnapshot = {
  version: HOME_SNAPSHOT_VERSION,
  savedAt: 1000,
  sections: {
    latest: [{ id: '1', company: 'A', title: 't', imageUrl: null, location: '서울', careerMin: 0, careerMax: null, bookmarked: false }],
    deadline: [{ id: '2', company: 'B', title: 't', imageUrl: null, location: '부산', careerMin: 1, careerMax: null, bookmarked: false }],
    popular: [{ id: '3', company: 'C', title: 't', imageUrl: null, location: '대전', careerMin: 2, careerMax: null, bookmarked: false }],
  },
  unreadCount: 1,
}

beforeEach(() => disk.clear())

describe('snapshot persist gate', () => {
  it('skips in-flight writes after logout generation bump or user switch', async () => {
    let current: string | null = 'u1'
    const gate = createSnapshotPersistGate(() => current)
    const qc = new QueryClient()
    hydrateHomeQueries(qc, snapshot)
    for (const kind of ['latest', 'deadline', 'popular'] as const) qc.setQueryData(['postings', 'home', kind], qc.getQueryData(['postings', 'home', kind]))
    qc.setQueryData(['notifications'], { data: [], page: { nextCursor: null, hasMore: false } })
    const gen = gate.currentGeneration()
    await persistHomeSnapshotIfCurrent(qc, 'u1', gen, gate)
    expect(disk.size).toBe(1)

    current = null
    gate.bumpGeneration()
    await persistHomeSnapshotIfCurrent(qc, 'u1', gen, gate)
    expect(disk.size).toBe(1)

    current = 'u2'
    await persistHomeSnapshotIfCurrent(qc, 'u1', gate.currentGeneration(), gate)
    expect(disk.size).toBe(1)
  })
})
