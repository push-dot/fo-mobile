import type { Session } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cancelQueries = vi.hoisted(() => vi.fn(async () => undefined))
const clearSpy = vi.hoisted(() => vi.fn())
const cache = vi.hoisted(() => new Map<string, unknown>())
const getItemAsync = vi.hoisted(() => vi.fn())
const setItemAsync = vi.hoisted(() => vi.fn(async () => undefined))
const deleteItemAsync = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('expo-secure-store', () => ({
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
}))
vi.mock('@/providers/query-client', () => ({
  queryClient: {
    cancelQueries,
    clear: () => {
      clearSpy()
      cache.clear()
    },
    setQueryData: (key: unknown[], data: unknown) => {
      cache.set(JSON.stringify(key), data)
    },
    getQueryData: (key: unknown[]) => cache.get(JSON.stringify(key)),
  },
}))

const session = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresIn: 3600,
  user: { id: 'u1', displayName: '김서준', locale: 'ko' },
} satisfies Session

describe('useSession.set', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    cache.clear()
    getItemAsync.mockResolvedValue(null)
    const { useSession } = await import('./session-store')
    useSession.setState({ session: null, ready: true })
  })

  it('clears the query cache when the session is cleared', async () => {
    const { queryClient } = await import('@/providers/query-client')
    const { useSession } = await import('./session-store')

    useSession.setState({ session, ready: true })
    queryClient.setQueryData(['me', 'profile'], { displayName: '이전 계정' })

    await useSession.getState().set(null)

    expect(cancelQueries).toHaveBeenCalled()
    expect(clearSpy).toHaveBeenCalled()
    expect(queryClient.getQueryData(['me', 'profile'])).toBeUndefined()
  })

  it('does not clear the query cache when signing in', async () => {
    const { queryClient } = await import('@/providers/query-client')
    const { useSession } = await import('./session-store')

    useSession.setState({ session: null, ready: true })
    queryClient.setQueryData(['me', 'profile'], { displayName: 'stash' })

    await useSession.getState().set(session)

    expect(clearSpy).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(['me', 'profile'])).toEqual({ displayName: 'stash' })
  })
})
