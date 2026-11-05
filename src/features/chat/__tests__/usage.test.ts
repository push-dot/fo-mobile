import { describe, expect, it } from 'vitest'
import { ERROR_TEXT } from '../constants'
import { isUsageExhausted, usageExhausted } from '../utils/usage'

const FREE_BODY = '이번 달 사용량을 다 썼어요. 요금제를 올리거나 크레딧을 구매할 수 있어요.'
const ULTRA_BODY = '이번 달 사용량을 다 썼어요. 크레딧을 구매하면 바로 이어서 쓸 수 있어요.'

describe('usage exhausted copy', () => {
  it('gives FREE and PRO an upgrade and a credit purchase', () => {
    for (const plan of ['FREE', 'PRO'] as const) {
      expect(usageExhausted(plan)).toEqual({
        body: FREE_BODY,
        actions: [
          { id: 'plan', label: '요금제 올리기', variant: 'secondary' },
          { id: 'credits', label: '크레딧 구매', variant: 'primary' },
        ],
      })
    }
  })

  it('gives ULTRA only a credit purchase', () => {
    expect(usageExhausted('ULTRA')).toEqual({ body: ULTRA_BODY, actions: [{ id: 'credits', label: '크레딧 구매', variant: 'primary' }] })
  })

  it('drops 충전, an AI key, and a yearly discount', () => {
    const text = JSON.stringify([usageExhausted('FREE'), usageExhausted('ULTRA'), ERROR_TEXT])
    expect(text).not.toContain('충전')
    expect(text).not.toContain('AI 키를 연결해야 쓸 수 있어요')
    expect(text).not.toContain('연간 -20%')
  })

  it('treats the credit errors as usage, and nothing else', () => {
    expect(isUsageExhausted('FEATURE_DISABLED')).toBe(true)
    expect(isUsageExhausted('INSUFFICIENT_CREDITS')).toBe(true)
    expect(isUsageExhausted('PLAN_REQUIRED')).toBe(false)
    expect(isUsageExhausted('CONSENT_REQUIRED')).toBe(false)
  })
})
