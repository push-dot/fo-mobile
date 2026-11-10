import type { Session } from '@push/api-client'
import { ApiError } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const set = vi.hoisted(() => vi.fn(async () => undefined))
const authRefresh = vi.hoisted(() => vi.fn())

const session = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresIn: 3600,
  user: { id: 'u1', displayName: '김서준', locale: 'ko' },
} satisfies Session

vi.hoisted(() => {
  vi.stubEnv('EXPO_PUBLIC_API_MOCK', '0')
})
vi.mock('expo-crypto', () => ({ randomUUID: () => 'id', digestStringAsync: async () => 'hash' }))
vi.mock('expo/fetch', () => ({ fetch: globalThis.fetch }))
vi.mock('./config', () => ({ API_BASE_URL: 'https://api.example/v1' }))
vi.mock('./session-store', () => ({
  useSession: { getState: () => ({ session, set }) },
}))
vi.mock('@push/api-client', async (orig) => {
  const actual = await orig<typeof import('@push/api-client')>()
  return {
    ...actual,
    createApi: () => ({ auth: { refresh: authRefresh } }),
  }
})

const { refreshSession } = await import('./api-client')

beforeEach(() => {
  vi.clearAllMocks()
  authRefresh.mockResolvedValue(session)
})

describe('refreshSession', () => {
  it('renews the session when refresh succeeds', async () => {
    await expect(refreshSession()).resolves.toBe(true)
    expect(authRefresh).toHaveBeenCalledWith('rt')
    expect(set).toHaveBeenCalledWith(session)
  })

  it('clears the session only on refresh auth failure', async () => {
    authRefresh.mockRejectedValue(new ApiError('nope', 'UNAUTHENTICATED', 401))
    await expect(refreshSession()).resolves.toBe(false)
    expect(set).toHaveBeenCalledWith(null)
  })

  it('keeps the session on transient refresh errors', async () => {
    authRefresh.mockRejectedValue(new ApiError('offline', 'NETWORK_ERROR', 0))
    await expect(refreshSession()).resolves.toBe(false)
    expect(set).not.toHaveBeenCalled()
  })

  it('does not hang when the refresh call itself returns 401', async () => {
    authRefresh.mockRejectedValue(new ApiError('nope', 'UNAUTHENTICATED', 401))
    const done = refreshSession()
    const raced = await Promise.race([done, new Promise((_, reject) => setTimeout(() => reject(new Error('hang')), 200))])
    await expect(raced).toBe(false)
    expect(set).toHaveBeenCalledWith(null)
  })

  it('shares one in-flight refresh across concurrent 401 retries', async () => {
    let release!: () => void
    authRefresh.mockImplementation(
      () =>
        new Promise<Session>((resolve) => {
          release = () => resolve(session)
        }),
    )
    const first = refreshSession()
    const second = refreshSession()
    release()
    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(authRefresh).toHaveBeenCalledTimes(1)
  })
})
