import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOME_SNAPSHOT_VERSION } from './constants'
import { toPostingCard } from './dto'
import { clearHomeSnapshot, parseHomeSnapshot, readHomeSnapshot, writeHomeSnapshot } from './store'
import type { HomeSnapshot } from './types'
import type { Posting } from '@push/api-client'

const fsMock = vi.hoisted(() => {
  const disk = new Map<string, string>()
  const DOC = 'file:///docs/'
  return { disk, DOC }
})

vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: fsMock.DOC,
  getInfoAsync: async (uri: string) => ({ exists: fsMock.disk.has(uri), uri, isDirectory: uri.endsWith('/') }),
  makeDirectoryAsync: async (uri: string) => {
    fsMock.disk.set(uri.endsWith('/') ? uri : `${uri}/`, '')
  },
  readAsStringAsync: async (uri: string) => fsMock.disk.get(uri) ?? '',
  writeAsStringAsync: async (uri: string, contents: string) => {
    fsMock.disk.set(uri, contents)
  },
  deleteAsync: async (uri: string) => {
    fsMock.disk.delete(uri)
  },
}))

const posting = (i: number): Posting => ({
  id: `p-${i}`,
  company: '모아페이 결제 플랫폼팀',
  title: `백엔드 엔지니어 (Kotlin·Spring) · 시니어 ${i}`,
  jobCategory: 'dev',
  imageUrl: '/images/long-path/cover.png',
  skills: ['kotlin', 'spring', 'redis', 'kafka', 'postgres', 'grafana'],
  careerMin: 4,
  careerMax: 8,
  location: '서울 · 강남',
  employmentType: 'full_time',
  deadline: '2026-12-31T00:00:00.000Z',
  bookmarked: i % 2 === 0,
  applied: false,
  sourceUrl: 'https://example.com/jobs',
  createdAt: '2026-01-01T00:00:00.000Z',
})

const realisticSnapshot = (savedAt: number): HomeSnapshot => {
  const cards = Array.from({ length: 10 }, (_, i) => toPostingCard(posting(i)))
  return {
    version: HOME_SNAPSHOT_VERSION,
    savedAt,
    sections: { latest: cards, deadline: cards, popular: cards },
    unreadCount: 12,
  }
}

const snapshot = (savedAt: number): HomeSnapshot => ({
  version: HOME_SNAPSHOT_VERSION,
  savedAt,
  sections: {
    latest: [{ id: '1', company: 'A', title: 't', imageUrl: null, location: '서울', careerMin: 0, careerMax: null, bookmarked: false }],
    deadline: [{ id: '2', company: 'B', title: 't', imageUrl: null, location: '부산', careerMin: 1, careerMax: 3, bookmarked: true }],
    popular: [{ id: '3', company: 'C', title: 't', imageUrl: null, location: '대전', careerMin: 2, careerMax: null, bookmarked: false }],
  },
  unreadCount: 3,
})

beforeEach(() => fsMock.disk.clear())

describe('home snapshot store', () => {
  it('rejects expired, wrong-version, and malformed payloads', () => {
    const now = 1_000_000
    expect(parseHomeSnapshot(null, now)).toBeNull()
    expect(parseHomeSnapshot('{', now)).toBeNull()
    expect(parseHomeSnapshot(JSON.stringify({ ...snapshot(now - 8 * 864e5), savedAt: now - 8 * 864e5 }), now)).toBeNull()
    expect(parseHomeSnapshot(JSON.stringify({ ...snapshot(now), version: 0 }), now)).toBeNull()
  })

  it('round-trips a trimmed snapshot on the filesystem without throwing on write errors', async () => {
    const now = 2_000_000
    const body = snapshot(now)
    await expect(writeHomeSnapshot('u1', body)).resolves.toBeUndefined()
    await expect(readHomeSnapshot('u1', now)).resolves.toEqual(body)
    await clearHomeSnapshot('u1')
    await expect(readHomeSnapshot('u1', now)).resolves.toBeNull()
  })

  it('keeps a realistic home payload small without full posting bodies', async () => {
    const now = 3_000_000
    const body = realisticSnapshot(now)
    await writeHomeSnapshot('u1', body)
    const uri = `${fsMock.DOC}home-snapshots/u1.json`
    const raw = fsMock.disk.get(uri)!
    expect(raw.length).toBeLessThan(20_000)
    expect(JSON.parse(raw).sections.latest[0].description).toBeUndefined()
  })
})
