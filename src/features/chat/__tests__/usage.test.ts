import { describe, expect, it } from 'vitest'
import { paymentsOpen } from '../../billing/utils/settle'
import { ERROR_TEXT } from '../constants'
import { composerPlaceholder, isUsageExhausted, planRequired, usageExhausted } from '../utils/usage'
import type { ChatItem } from '../types'

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

  it('offers no buy button while payments are closed', () => {
    for (const plan of ['FREE', 'PRO', 'ULTRA'] as const) {
      expect(usageExhausted(plan, false)).toEqual({ body: '이번 달 사용량을 다 썼어요. 결제는 아직 준비 중이에요.', actions: [] })
    }
  })

  it('offers no buy button before the account loads', () => {
    expect(usageExhausted(undefined, false)).toEqual({ body: '이번 달 사용량을 다 썼어요.', actions: [] })
    expect(usageExhausted(undefined)).toEqual({ body: '이번 달 사용량을 다 썼어요.', actions: [] })
  })

  it('keeps the buy buttons for an older server that sends no flag', () => {
    expect(usageExhausted('FREE', paymentsOpen({}))).toEqual(usageExhausted('FREE'))
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

describe('composerPlaceholder', () => {
  const run = (items: ChatItem[], working = false) => composerPlaceholder({ items, working: working ? { verbs: [], startedAt: 0 } : null })
  const user: ChatItem = { type: 'user', id: 'u', text: '모아페이' }
  const error = (code: string): ChatItem => ({ type: 'error', id: 'e', text: '', code })

  it('asks for a link on an empty chat and after a failed first run', () => {
    expect(run([])).toBe('공고 링크를 붙여넣어 보세요')
    expect(run([user, error('UNKNOWN')])).toBe('공고 링크를 붙여넣어 보세요')
    expect(run([user, { type: 'agentText', id: 'a', text: '좋아요' }, { type: 'tool', id: 't', action: '이력서 읽기', state: 'ok' }, error('UNKNOWN')])).toBe('공고 링크를 붙여넣어 보세요')
  })

  it('keeps the follow-up line when a later run fails in a chat that already has work', () => {
    expect(run([user, { type: 'agentText', id: 'a', text: '다 됐어요' }, { type: 'worked', id: 'w', seconds: 3 }, user, error('UNKNOWN')])).toBe('더 고칠 부분이 있으면 말해 주세요')
  })

  it('keeps the follow-up line after work and after the usage card', () => {
    expect(run([user, { type: 'agentText', id: 'a', text: '다 됐어요' }, { type: 'worked', id: 'w', seconds: 3 }])).toBe('더 고칠 부분이 있으면 말해 주세요')
    expect(run([user, error('INSUFFICIENT_CREDITS')])).toBe('더 고칠 부분이 있으면 말해 주세요')
  })

  it('counts a reopened chat, whose turns carry no worked row, as work', () => {
    expect(run([user, { type: 'agentText', id: 'a', text: '자료 분석을 마쳤어요.' }, user, error('UNKNOWN')])).toBe('더 고칠 부분이 있으면 말해 주세요')
  })

  it('lets the person talk while the agent works', () => {
    expect(run([user], true)).toBe('작업 중에도 말할 수 있어요')
  })

  it('never asks to upgrade on PLAN_REQUIRED while payments are closed or the account is unknown', () => {
    expect(planRequired('FREE', true)).toBe('요금제를 올리면 쓸 수 있어요.')
    expect(planRequired('FREE', false)).toBe('지금 요금제에서는 쓸 수 없어요. 결제는 아직 준비 중이에요.')
    expect(planRequired(undefined, false)).toBe('지금 요금제에서는 쓸 수 없어요.')
  })
})
