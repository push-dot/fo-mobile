import { describe, expect, it } from 'vitest'
import { UPLOAD_ERROR_CODE } from '../constants'
import { creditBanner, endsInError, headerLightOf, unseenBotMessages } from '../components/header/state'
import type { ChatItem } from '../types'

describe('headerLightOf', () => {
  it('shows nothing, green for unseen bot lines, and red once credits run out', () => {
    expect(headerLightOf({ creditsOut: false, unseenBotMessages: 0 })).toBe('none')
    expect(headerLightOf({ creditsOut: false, unseenBotMessages: 2 })).toBe('new')
    expect(headerLightOf({ creditsOut: true, unseenBotMessages: 0 })).toBe('limit')
  })

  it('turns red when the last run failed, and clears once the thread moves on', () => {
    expect(headerLightOf({ creditsOut: false, unseenBotMessages: 0, failed: true })).toBe('error')
    expect(headerLightOf({ creditsOut: false, unseenBotMessages: 2, failed: true })).toBe('error')
    expect(endsInError([{ type: 'user', id: 'u', text: 'x' }, { type: 'error', id: 'e', text: 'x' }])).toBe(true)
    expect(endsInError([{ type: 'error', id: 'e', text: 'x' }, { type: 'user', id: 'u', text: 'x' }])).toBe(false)
    expect(endsInError([])).toBe(false)
    // A busy queue refused the message before a run began (ChatStates.4 draws no lamp).
    expect(endsInError([{ type: 'user', id: 'u', text: 'x' }, { type: 'error', id: 'e', text: 'x', code: 'QUEUE_BUSY' }])).toBe(false)
    // ChatErrUpload: the line says the file did not go up; no run failed, so no red lamp.
    expect(endsInError([{ type: 'user', id: 'u', text: 'x' }, { type: 'error', id: 'e', text: 'x', code: UPLOAD_ERROR_CODE }])).toBe(false)
  })

  it('lets red win over green', () => {
    expect(headerLightOf({ creditsOut: true, unseenBotMessages: 3 })).toBe('limit')
  })
})

describe('creditBanner', () => {
  const refillAt = new Date(2026, 11, 1)

  it('shows the line without a button before the account loads', () => {
    expect(creditBanner({ plan: undefined, refillAt, paymentsEnabled: true })).toEqual({ lines: ['이번 달 사용량을 모두 썼어요.'], action: null })
  })

  it('tells FREE and PRO when the allowance returns and offers the plan page', () => {
    for (const plan of ['FREE', 'PRO'] as const) {
      expect(creditBanner({ plan, refillAt, paymentsEnabled: true })).toEqual({ lines: ['이번 달 사용량을 모두 썼어요.', '12월 1일에 다시 채워져요.'], action: 'plan' })
    }
  })

  it('leaves the refill sentence out when the server sends no date', () => {
    expect(creditBanner({ plan: 'FREE', refillAt: null, paymentsEnabled: true })).toEqual({ lines: ['이번 달 사용량을 모두 썼어요.'], action: 'plan' })
  })

  it('offers ULTRA a credit purchase', () => {
    expect(creditBanner({ plan: 'ULTRA', refillAt, paymentsEnabled: true })).toEqual({
      lines: ['이번 달 사용량을 모두 썼어요.', '크레딧을 사면 바로 이어서 쓸 수 있어요.'],
      action: 'credits',
    })
  })

  it('offers no button while payments are closed', () => {
    expect(creditBanner({ plan: 'ULTRA', refillAt, paymentsEnabled: false })?.action).toBeNull()
    expect(creditBanner({ plan: 'PRO', refillAt, paymentsEnabled: false })?.action).toBeNull()
  })
})

describe('unseenBotMessages', () => {
  const items: ChatItem[] = [
    { type: 'user', id: 'u1', text: '안녕' },
    { type: 'agentText', id: 'a1', text: '네' },
    { type: 'worked', id: 'w1', seconds: 2 },
    { type: 'agentText', id: 'a2', text: '다 했어요' },
  ]

  it('counts only bot lines after the last time the reader was at the bottom', () => {
    expect(unseenBotMessages(items, 'a2')).toBe(0)
    expect(unseenBotMessages(items, 'a1')).toBe(1)
    expect(unseenBotMessages(items, undefined)).toBe(2)
  })

  it('does not count older turns paged in at the front', () => {
    const older: ChatItem[] = [
      { type: 'user', id: 'u0', text: '전에' },
      { type: 'agentText', id: 'a0', text: '그때' },
    ]
    expect(unseenBotMessages([...older, ...items], 'a2')).toBe(0)
  })

  it('counts nothing when the seen line is gone', () => {
    expect(unseenBotMessages(items, 'gone')).toBe(0)
  })
})
