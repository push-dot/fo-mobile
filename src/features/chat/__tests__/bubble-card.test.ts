import { describe, expect, it } from 'vitest'
import { foldBubbleCards } from '../utils/bubble-card'
import type { ChatItem, PlanItem } from '../types'

const text: ChatItem = { type: 'agentText', id: 'a', text: '이 공고 기준으로 고칠 점이에요.' }
const plan = (title: string): PlanItem => ({ type: 'plan', id: 'p', title, meta: '', rows: [{ tag: '성과', tone: 'grey', label: '숫자가 부족해요', note: '수치로 보여 주세요' }], keywords: [] })

describe('foldBubbleCards', () => {
  it('moves an untitled plan into the bot line before it (ChatPh1Feedback)', () => {
    const rows = foldBubbleCards([text, plan('')])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ type: 'agentText', id: 'a', card: { id: 'p' } })
  })

  it('leaves a titled plan as its own card', () => {
    expect(foldBubbleCards([text, plan('수정 전략')]).map((r) => r.type)).toEqual(['agentText', 'plan'])
  })

  it('leaves an untitled plan with no bot line before it', () => {
    expect(foldBubbleCards([{ type: 'user', id: 'u', text: '네' }, plan('')]).map((r) => r.type)).toEqual(['user', 'plan'])
  })
})
