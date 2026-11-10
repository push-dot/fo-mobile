import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOME_SNAPSHOT_VERSION } from './constants'
import { hydrateHomeQueries } from './hydrate'
import { createSnapshotPersistGate, persistHomeSnapshotIfCurrent } from './persist'
import type { HomeSnapshot } from './types'

const disk = vi.hoisted(() => new Map<string, string>())

vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: async (uri: string) => ({ exists: disk.has(uri), uri, isDirectory: false }),
  makeDirectoryAsync: async () => undefined,
  writeAsStringAsync: async (uri: string, contents: string) => {
    disk.set(uri, contents)
  },
  readAsStringAsync: async (uri: string) => disk.get(uri) ?? '',
  deleteAsync: async (uri: string) => {
    disk.delete(uri)
  },
}))

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
