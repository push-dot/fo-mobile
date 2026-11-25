import type { Consent, Session } from '@push/api-client'
import { LEGAL_VERSION } from '@push/shared'
import { describe, expect, it, vi } from 'vitest'
import { evaluateColdStartTerms, runColdStartTermsCheck, shouldRunColdStartTermsForUser } from './cold-start-terms'

const session = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresIn: 3600,
  user: { id: 'u1', displayName: '테스트', locale: 'ko' },
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

describe('cold-start terms check', () => {
  it('routes stale terms with replace and stays silent on fetch errors', async () => {
    const route = vi.fn()
    expect(evaluateColdStartTerms(terms('2020-01-01'), { route })).toBe('routed')
    expect(route).toHaveBeenCalled()

    await expect(runColdStartTermsCheck(session, async () => terms(LEGAL_VERSION), { route })).resolves.toBe('current')
    await expect(runColdStartTermsCheck(session, async () => { throw new Error('offline') }, { route })).resolves.toBe('silent')
  })

  it('runs once per user id', () => {
    expect(shouldRunColdStartTermsForUser(null, 'u1')).toBe(true)
    expect(shouldRunColdStartTermsForUser('u1', 'u1')).toBe(false)
    expect(shouldRunColdStartTermsForUser('u1', 'u2')).toBe(true)
  })
})
