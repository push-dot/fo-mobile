import { ApiError } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { isRefreshAuthFailure } from './refresh-auth-failure'

describe('isRefreshAuthFailure', () => {
  it('treats 401 and 403 from refresh as auth failure', () => {
    expect(isRefreshAuthFailure(new ApiError('nope', 'UNAUTHENTICATED', 401))).toBe(true)
    expect(isRefreshAuthFailure(new ApiError('nope', 'FORBIDDEN', 403))).toBe(true)
  })

  it('treats invalid or expired refresh token codes as auth failure', () => {
    expect(isRefreshAuthFailure(new ApiError('expired', 'TOKEN_EXPIRED', 400))).toBe(true)
    expect(isRefreshAuthFailure(new ApiError('bad', 'INVALID_REFRESH_TOKEN', 400))).toBe(true)
  })

  it('keeps the session on network errors, timeouts, and 5xx', () => {
    expect(isRefreshAuthFailure(new ApiError('offline', 'NETWORK_ERROR', 0))).toBe(false)
    expect(isRefreshAuthFailure(new ApiError('busy', 'HTTP_ERROR', 503))).toBe(false)
    expect(isRefreshAuthFailure(new Error('fetch failed'))).toBe(false)
  })
})
