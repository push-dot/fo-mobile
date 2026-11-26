import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  applications: { list: vi.fn() },
  me: { follows: vi.fn(), bookmarks: vi.fn(), postingViews: vi.fn(), profile: vi.fn() },
  profiles: { list: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({ api, http: {}, API_BASE_URL: 'https://api.test', API_MOCK: false }))
vi.mock('@/shared/infrastructure/sources', () => ({ sourcesApi: { list: vi.fn() } }))
vi.mock('../utils/quick-start-data', () => ({
  QS_NEEDS: { status: ['applications'], coffee: ['follows', 'recommended'], gap: ['bookmarks', 'recent', 'doc'], hub: ['doc', 'profile'] },
  quickStartFrom: (key: string, sources: object) => ({ key, sources }),
}))

const { chatApi } = await import('../api/fetchers')

beforeEach(() => vi.clearAllMocks())

describe('chatApi.quickStart', () => {
  it('rejects when every needed loader fails', async () => {
    const down = new Error('down')
    api.applications.list.mockRejectedValue(down)
    await expect(chatApi.quickStart('status')).rejects.toBe(down)
  })

  it('keeps the loaded sources when only some loaders fail', async () => {
    api.me.follows.mockRejectedValue(new Error('down'))
    api.profiles.list.mockResolvedValue({ data: ['p'] })
    await expect(chatApi.quickStart('coffee')).resolves.toEqual({ key: 'coffee', sources: { follows: undefined, recommended: ['p'] } })
  })

  it('rejects when every fetched loader fails on a sheet that also needs the doc', async () => {
    const down = new Error('down')
    api.me.bookmarks.mockRejectedValue(down)
    api.me.postingViews.mockRejectedValue(new Error('down'))
    await expect(chatApi.quickStart('gap')).rejects.toBe(down)
  })

  it('keeps the hub sheet when its profile fails', async () => {
    api.me.profile.mockRejectedValue(new Error('down'))
    await expect(chatApi.quickStart('hub')).resolves.toMatchObject({ key: 'hub', sources: { profile: undefined } })
  })
})
