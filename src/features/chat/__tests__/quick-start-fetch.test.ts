import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  applications: { list: vi.fn() },
  me: { follows: vi.fn() },
  profiles: { list: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({ api, http: {}, API_BASE_URL: 'https://api.test', API_MOCK: false }))
vi.mock('@/shared/infrastructure/sources', () => ({ sourcesApi: { list: vi.fn() } }))
vi.mock('../utils/quick-start-data', () => ({
  QS_NEEDS: { status: ['applications'], coffee: ['follows', 'recommended'] },
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
})
