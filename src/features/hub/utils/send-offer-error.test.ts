import { ApiError } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { sendOfferError } from './send-offer-error'

describe('sendOfferError', () => {
  it('says the person cannot be offered to when they blocked the viewer', () => {
    expect(sendOfferError(new ApiError('blocked', 'BLOCKED', 403))).toBe(
      '지금은 이 사람에게 제안을 보낼 수 없어요.',
    )
  })

  it('keeps the other messages', () => {
    expect(sendOfferError(new ApiError('dup', 'CONFLICT', 409))).toBe('이미 제안을 보냈어요.')
    expect(sendOfferError(new ApiError('x', 'FORBIDDEN', 403))).toBe(
      '제안을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
    )
  })
})
