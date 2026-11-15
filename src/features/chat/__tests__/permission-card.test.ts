import type { StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import type { Approval } from '../types'

const { applyEvent, emptyChat } = await import('../utils/reducer')
const { isSiteCard, waitingLine } = await import('../utils/card')
const { mapEvent } = await import('../utils/stream')

const OPENED = Date.parse('2026-11-13T01:00:00Z')

const card = (over: Partial<Approval> = {}): Approval => ({
  id: 'card1',
  question: '모아페이 채용 페이지를 열어도 될까요?',
  sections: [],
  confirm: true,
  openedAt: OPENED,
  optionIds: ['approve', 'approve_always', 'reject'],
  ...over,
})

describe('waitingLine', () => {
  it('shows for as long as the card is open: a card waits until answered', () => {
    expect(waitingLine(card())).toMatchObject({ kind: 'waiting', for: 'confirm', text: '확인을 기다리고 있어요', cardId: 'card1' })
    expect(waitingLine(null)).toBeNull()
  })

  it('counts the wait from the ask', () => {
    expect(waitingLine(card())?.since.getTime()).toBe(OPENED)
  })
})

describe('reducer', () => {
  it('dismiss drops the card with no answer bubble', () => {
    const next = applyEvent({ ...emptyChat, approval: card() }, { type: 'dismiss' })
    expect(next.approval).toBeNull()
    expect(next.items).toEqual([])
  })
})

describe('mapEvent of a page-read approval', () => {
  const frame = {
    type: 'approval',
    id: 'card1',
    kind: 'TOOL_ACTION',
    title: '모아페이 채용 페이지를 열어도 될까요?',
    summary: 'careers.moapay.co.kr · 공고 1개를 읽어요',
    options: [
      { id: 'approve', label: '한 번 허용' },
      { id: 'approve_always', label: '항상 허용', desc: '이 Bot이 이 사이트를 읽을 때 다시 묻지 않아요' },
      { id: 'reject', label: '거절' },
    ],
    seq: 2,
    turn: 't1',
    at: '2026-11-13T01:00:00.007Z',
  } as StreamEvent

  it('keeps the title as the question, the summary under it, and reads the ask from the stamp', () => {
    const [event] = mapEvent(frame)
    expect(event).toMatchObject({ type: 'approval' })
    const approval = (event as { approval: Approval }).approval
    expect(approval).toMatchObject({
      question: '모아페이 채용 페이지를 열어도 될까요?',
      detail: 'careers.moapay.co.kr · 공고 1개를 읽어요',
        confirm: true,
      openedAt: Date.parse('2026-11-13T01:00:00.007Z'),
    })
    expect(approval.warning).toBeUndefined()
    expect(approval.foot).toBeUndefined()
    expect(approval.sections[0]).toMatchObject({ kind: 'choices', selected: [] })
  })

  it('recognises the card by its 항상 허용 answer', () => {
    expect(isSiteCard(['approve', 'approve_always', 'reject'])).toBe(true)
    expect(isSiteCard(['approve', 'reject'])).toBe(false)
  })
})

describe('mock page-read script', () => {
  it('asks with three answers and no expiry', async () => {
    const { pageReadCard, pageReadFrames } = await import('../../../mock/bot-scripts/cards')
    const now = new Date('2026-11-13T01:00:00Z')
    const c = pageReadCard('c9', 't9', '모아페이', 'careers.moapay.co.kr', now)
    const frames = pageReadFrames(c, 't9', now, 0)
    const approval = (mapEvent(frames[1]! as unknown as StreamEvent)[0] as { approval: Approval }).approval
    expect(approval.optionIds).toEqual(['approve', 'approve_always', 'reject'])
    expect(approval.foot).toBeUndefined()
    expect(frames[1]).not.toHaveProperty('expiresAt')
    expect(frames.map((f) => f.type)).toEqual(['status', 'approval', 'done'])
  })
})
