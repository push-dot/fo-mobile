import { ApiError } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { shouldRetry } from './query-client'

describe('shouldRetry', () => {
  it('does not retry a 4xx', () => {
    for (const status of [400, 401, 403, 404, 499]) expect(shouldRetry(0, new ApiError('x', 'E', status))).toBe(false)
  })

  it('retries a 5xx and a network error twice', () => {
    expect(shouldRetry(0, new ApiError('x', 'E', 500))).toBe(true)
    expect(shouldRetry(1, new TypeError('network'))).toBe(true)
    expect(shouldRetry(2, new TypeError('network'))).toBe(false)
  })
})
