import { beforeEach, describe, expect, it, vi } from 'vitest'

const fs = vi.hoisted(() => ({ disk: new Map<string, Uint8Array>(), dirs: new Set<string>(), shared: [] as { uri: string; mimeType?: string; bytes?: Uint8Array }[] }))
const share = vi.hoisted(() => ({ fail: false }))

vi.mock('expo-crypto', () => {
  let n = 0
  return { randomUUID: () => `u${++n}` }
})
vi.mock('expo-file-system', () => {
  const path = (parts: unknown[]) => parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/')
  class Directory {
    uri: string
    constructor(...parts: unknown[]) {
      this.uri = path(parts)
    }
    get exists() {
      return fs.dirs.has(this.uri)
    }
    create() {
      fs.dirs.add(this.uri)
    }
    delete() {
      fs.dirs.delete(this.uri)
      for (const k of [...fs.disk.keys()]) if (k.startsWith(`${this.uri}/`)) fs.disk.delete(k)
    }
  }
  class File {
    uri: string
    constructor(...parts: unknown[]) {
      this.uri = path(parts)
    }
    write(bytes: Uint8Array) {
      if (fs.disk.has(this.uri)) throw new Error('exists')
      fs.disk.set(this.uri, bytes)
    }
  }
  return { Directory, File, Paths: { cache: 'cache' } }
})
vi.mock('expo-sharing', () => ({
  shareAsync: async (uri: string, o: { mimeType?: string }) => {
    fs.shared.push({ uri, mimeType: o.mimeType, bytes: fs.disk.get(uri) })
    if (share.fail) throw new Error('share sheet failed')
  },
}))

const { shareBytes } = await import('./share-file')

describe('shareBytes', () => {
  beforeEach(() => {
    fs.disk.clear()
    fs.dirs.clear()
    fs.shared.length = 0
    share.fail = false
  })

  it('shares same-name files from separate folders with their own bytes', async () => {
    await shareBytes('이력서.pdf', Uint8Array.of(1), 'application/pdf')
    await shareBytes('이력서.pdf', Uint8Array.of(2), 'application/pdf')
    expect(fs.shared.map((s) => s.bytes?.[0])).toEqual([1, 2])
    expect(new Set(fs.shared.map((s) => s.uri)).size).toBe(2)
    expect(fs.shared.every((s) => s.uri.endsWith('/이력서.pdf') && s.mimeType === 'application/pdf')).toBe(true)
  })

  it('leaves nothing in the cache after a share or a failed one', async () => {
    await shareBytes('a.pdf', Uint8Array.of(1))
    share.fail = true
    await expect(shareBytes('b.pdf', Uint8Array.of(2))).rejects.toThrow('share sheet failed')
    expect(fs.disk.size).toBe(0)
    expect(fs.dirs.size).toBe(0)
  })
})
