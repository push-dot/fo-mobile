import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOME_SNAPSHOT_VERSION } from '../constants'
import { toPostingCard } from './snapshot-dto'
import { clearHomeSnapshot, parseHomeSnapshot, readHomeSnapshot, writeHomeSnapshot } from './snapshot-store'
import type { HomeSnapshot } from '../types'
import type { Posting } from '@push/api-client'

const fsMock = vi.hoisted(() => {
  const disk = new Map<string, string>()
  const DOC = 'file:///docs/'
  return { disk, DOC }
})

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
      return fsMock.disk.has(this.uri)
    }
    async text() {
      return fsMock.disk.get(this.uri) ?? ''
    }
    async write(contents: string) {
      fsMock.disk.set(this.uri, contents)
    }
    delete() {
      fsMock.disk.delete(this.uri)
    }
  }
  return { Directory, File, Paths: { document: new Directory(fsMock.DOC) } }
})

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

const LEGACY_URI = `${fsMock.DOC}home-snapshots/u1.json`

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

  it('writes to the same file the legacy store used', async () => {
    await writeHomeSnapshot('u1', snapshot(4_000_000))
    expect([...fsMock.disk.keys()]).toEqual([LEGACY_URI])
  })

  it('keeps a realistic home payload small without full posting bodies', async () => {
    const now = 3_000_000
    const body = realisticSnapshot(now)
    await writeHomeSnapshot('u1', body)
    const raw = fsMock.disk.get(LEGACY_URI)!
    expect(raw.length).toBeLessThan(20_000)
    expect(JSON.parse(raw).sections.latest[0].description).toBeUndefined()
  })
})
