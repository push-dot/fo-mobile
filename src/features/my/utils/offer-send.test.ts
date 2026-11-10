import { ApiError } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { composerClosed, failedLine, failedSend } from './offer-send'

const blocked = new ApiError('this user is not accepting messages from you', 'BLOCKED', 403)
const server = new ApiError('boom', 'INTERNAL', 500)

describe('a message that fails to send', () => {
  it('keeps the retry icon and the composer when the server just failed', () => {
    const f = failedSend('안녕하세요', server)
    expect(failedLine(f)).toEqual({ title: '메시지를 보내지 못했어요', retry: true })
    expect(composerClosed([f])).toBe(false)
    expect(composerClosed([failedSend('x', new Error('offline'))])).toBe(false)
  })

  it('drops the retry icon and closes the composer when the other person blocked the viewer', () => {
    const f = failedSend('안녕하세요', blocked)
    expect(failedLine(f)).toEqual({ title: '메시지를 보낼 수 없어요', retry: false })
    expect(composerClosed([failedSend('a', server), f])).toBe(true)
  })

  it('closes the composer before any send when push-be says the offer takes no messages', () => {
    expect(composerClosed([], false)).toBe(true)
    expect(composerClosed([], true)).toBe(false)
    expect(composerClosed([])).toBe(false)
  })
})
