import { describe, expect, it } from 'vitest'
import { ApiError } from '@push/api-client'
import { canMoveDocuments, contactFailureLine } from './contact'

describe('contact errors', () => {
  it('maps both code kinds to one line', () => {
    expect(contactFailureLine(new ApiError('x', 'EMAIL_CODE_INVALID', 400))).toBe('인증번호가 맞지 않아요')
    expect(contactFailureLine(new ApiError('x', 'PHONE_CODE_EXPIRED', 400))).toBe('인증번호 시간이 지났어요. 다시 받아 주세요')
    expect(contactFailureLine(new ApiError('x', 'RATE_LIMITED', 429, { retryAfterSec: 42 }))).toBe('42초 뒤에 다시 받을 수 있어요')
    expect(contactFailureLine(new Error('x'))).toBe('잠시 후 다시 시도해 주세요.')
  })

  it('offers a move only when the server says so', () => {
    expect(canMoveDocuments(new ApiError('x', 'PHONE_TAKEN', 409, { canMoveDocuments: true }))).toBe(true)
    expect(canMoveDocuments(new ApiError('x', 'PHONE_TAKEN', 409, { conflict: 'PHONE' }))).toBe(false)
  })
})
