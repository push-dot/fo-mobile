import { describe, expect, it } from 'vitest'
import { foldBubbleCards } from '../utils/bubble-card'
import type { ChatItem, PlanItem } from '../types'

const text: ChatItem = { type: 'agentText', id: 'a', text: '이 공고 기준으로 고칠 점이에요.' }
const plan = (title: string): PlanItem => ({ type: 'plan', id: 'p', title, meta: '', rows: [{ tag: '성과', label: '숫자가 부족해요', note: '수치로 보여 주세요' }], keywords: [] })

describe('foldBubbleCards', () => {
  it('moves an untitled plan into the bot line before it (ChatPh1Feedback)', () => {
    const rows = foldBubbleCards([text, plan('')])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ type: 'agentText', id: 'a', card: { id: 'p' } })
  })

  it('moves a titled plan into the bot line too (ChatPh2)', () => {
    expect(foldBubbleCards([text, plan('수정 전략')]).map((r) => r.type)).toEqual(['agentText'])
  })

  it('moves a diff into the bot line before it, which says what was changed (ChatPh3Review, ChatApprove)', () => {
    const diff: ChatItem = { type: 'diff', id: 'd', lines: [{ sign: '+', text: '가' }] }
    const rows = foldBubbleCards([text, diff])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ type: 'agentText', id: 'a', diff: { id: 'd' } })
    expect(foldBubbleCards([{ type: 'user', id: 'u', text: '네' }, diff]).map((r) => r.type)).toEqual(['user', 'diff'])
  })

  it('leaves a plan with no bot line before it', () => {
    expect(foldBubbleCards([{ type: 'user', id: 'u', text: '네' }, plan('')]).map((r) => r.type)).toEqual(['user', 'plan'])
  })

  it('moves the result card into the closing line before it, unless a profile-save note is still open (ChatPh6Result)', () => {
    const closing: ChatItem = { type: 'agentText', id: 'done-r', text: '다 됐어요!' }
    const profile: Extract<ChatItem, { type: 'result'; source: 'profile' }> = { type: 'result', id: 'r', source: 'profile', checklist: [], documentId: 'd1', actions: [], name: '김서준', headline: '', title: '김서준', subtitle: '' }
    const rows = foldBubbleCards([closing, profile])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ type: 'agentText', result: { id: 'r' } })
    expect(foldBubbleCards([closing, { ...profile, pendingNote: '메모' }]).map((r) => r.type)).toEqual(['agentText', 'result'])
    expect(foldBubbleCards([text, profile]).map((r) => r.type)).toEqual(['agentText', 'result'])
  })

  it('follows a file the bot could not save with its own line that offers 다시 저장하기 (ChatPh6ResultFail)', () => {
    const closing: ChatItem = { type: 'agentText', id: 'done-r', text: '다 됐어요!' }
    const file = { type: 'result', id: 'r', source: 'external', checklist: [], documentId: 'd1', actions: [], fileName: '김서준_모아페이_백엔드.pdf', pageLine: 'A4 1쪽' } as ChatItem
    const rows = foldBubbleCards([closing, file])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ result: { id: 'r' } })
    expect(rows[1]).toEqual({ type: 'agentText', id: 'save-fail-r', text: '내 서류에 저장하지 못했어요. 네트워크를 확인해 주세요.', retry: true })
    expect(foldBubbleCards([closing, { ...file, savedLine: '내 서류에 자동 저장됨' } as ChatItem])).toHaveLength(1)
  })
})
