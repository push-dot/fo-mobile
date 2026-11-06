import { ApiError } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { retryUnlessMissing } from '../utils/retry'

describe('retryUnlessMissing', () => {
  it('gives up on a 404 at once and retries other failures three times', () => {
    expect(retryUnlessMissing(0, new ApiError('conversation', 'NOT_FOUND', 404))).toBe(false)
    expect(retryUnlessMissing(0, new ApiError('oops', 'INTERNAL', 500))).toBe(true)
    expect(retryUnlessMissing(2, new Error('network'))).toBe(true)
    expect(retryUnlessMissing(3, new Error('network'))).toBe(false)
  })
})
