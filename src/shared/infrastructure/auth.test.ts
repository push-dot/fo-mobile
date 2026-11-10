import type { Consent, Session } from '@push/api-client'
import { LEGAL_VERSION } from '@push/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hold = vi.hoisted(() => vi.fn())
const push = vi.hoisted(() => vi.fn())
const setSession = vi.hoisted(() => vi.fn(async () => undefined))
const consents = vi.hoisted(() => vi.fn())
const exchange = vi.hoisted(() => vi.fn())

vi.mock('expo-crypto', () => ({
  getRandomBytes: () => new Uint8Array(32),
  digestStringAsync: async () => 'hash',
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { HEX: 'hex', BASE64: 'base64' },
}))
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('expo-router', () => ({ router: { push } }))
vi.mock('./session-store', () => ({ useSession: { getState: () => ({ set: setSession }) } }))
vi.mock('./api-client', () => ({ api: { me: { consents }, auth: { start: async () => ({ authorizationUrl: 'https://auth.example/start' }), exchange } } }))
vi.mock('./pkce', () => ({ createPkce: async () => ({ verifier: 'verifier', challenge: 'challenge' }) }))
vi.mock('./platform', () => ({ openAuthSession: async () => ({ type: 'success', url: 'https://push.app/callback?code=abc' }) }))
vi.mock('../../features/auth/utils/auth-flow', () => ({ isAppleCancel: () => false }))
vi.mock('../../features/auth/stores', () => ({ usePhoneAuth: { getState: () => ({ hold }) } }))

const { signIn } = await import('./auth')

const session = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresIn: 3600,
  user: { id: 'u1', displayName: '김서준', locale: 'ko' },
} satisfies Session

const terms = (version: string | null): Consent => ({
  referenceData: false,
  updatedAt: null,
  terms: {
    version,
    age14At: '2026-10-21T00:00:00.000Z',
    serviceTermsAt: '2026-10-21T00:00:00.000Z',
    privacyAt: '2026-10-21T00:00:00.000Z',
    marketing: false,
    marketingAt: null,
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  exchange.mockResolvedValue(session)
  setSession.mockResolvedValue(undefined)
})

describe('social sign-in terms gate', () => {
  it('sends a returning account with a stale terms version to consent without opening the session', async () => {
    consents.mockResolvedValue(terms('2026-10-29'))
    await expect(signIn('google')).resolves.toEqual({ kind: 'terms' })
    expect(consents).toHaveBeenCalledWith('at')
    expect(hold).toHaveBeenCalledWith(session)
    expect(push).toHaveBeenCalledWith('/signup-terms')
    expect(setSession).not.toHaveBeenCalled()
  })

  it('sends an account with no terms record to consent', async () => {
    consents.mockResolvedValue({ referenceData: false, updatedAt: null })
    await expect(signIn('github')).resolves.toEqual({ kind: 'terms' })
    expect(hold).toHaveBeenCalledWith(session)
    expect(push).toHaveBeenCalledWith('/signup-terms')
    expect(setSession).not.toHaveBeenCalled()
  })

  it('opens the session when the stored terms version is current', async () => {
    consents.mockResolvedValue(terms(LEGAL_VERSION))
    await expect(signIn('google')).resolves.toEqual({ kind: 'session' })
    expect(setSession).toHaveBeenCalledWith(session)
    expect(hold).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('does not open a session when the terms read fails', async () => {
    consents.mockRejectedValue(new Error('offline'))
    await expect(signIn('google')).rejects.toThrow('offline')
    expect(setSession).not.toHaveBeenCalled()
    expect(hold).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })
})
