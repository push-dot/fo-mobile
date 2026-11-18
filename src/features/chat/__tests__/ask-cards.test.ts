import type { BotContract, StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { confirmModal } from '../utils/choice-sheet'
import { mapEvent } from '../utils/stream'
import { restoreBotTurns } from '../utils/turns'
import type { Approval } from '../types'

const ASKED = '2026-11-14T01:00:00.000Z'
const approvalOf = (ev: StreamEvent): Approval => {
  const e = mapEvent(ev).find((x) => x.type === 'approval')
  if (e?.type !== 'approval') throw new Error('no approval')
  return e.approval
}

const help: StreamEvent = {
  type: 'choice',
  id: 'st-help',
  title: '지원 동기 첫 문장을 어느 쪽으로 쓸까요?',
  options: [{ id: '0', label: '제품 관점' }, { id: '1', label: '데이터 관점' }],
}

describe('a choice card that carries its ask time (ChatBotStatusHelp)', () => {
  it('keeps its ask time from the stamp and preselects nothing (the room then opens the modal)', () => {
    const card = approvalOf({ ...help, at: ASKED } as StreamEvent)
    expect(card.openedAt).toBe(Date.parse(ASKED))
    expect(card.sections[0]).toMatchObject({ selected: [] })
  })

  it('keeps its first pick when the frame has no stamp', () => {
    const card = approvalOf(help)
    expect(card.openedAt).toBeUndefined()
    expect(card.sections[0]).toMatchObject({ selected: [0] })
  })

  it('keeps the recommended pick even when the frame is stamped', () => {
    const card = approvalOf({ ...help, at: ASKED, recommended: '1' } as StreamEvent)
    expect(card.sections[0]).toMatchObject({ selected: [1] })
  })
})

describe('the edit card (ChatApprove)', () => {
  const edit: StreamEvent = {
    type: 'approval',
    id: 'tailor-apply',
    kind: 'DOCUMENT_EDIT',
    title: '이 수정을 적용할까요?',
    options: [{ id: 'apply', label: '적용' }, { id: 'keep', label: '그대로 두기' }],
  }

  it('is one 적용 button and draws no sentence about the change, even when the server sends a summary', () => {
    const card = approvalOf({ ...edit, title: '수정 적용', summary: '경력 섹션 3줄을 고쳤어요.' })
    expect(confirmModal(card)).toEqual({ title: '수정 적용', confirm: '적용' })
    expect(card.detail).toBeUndefined()
  })

  it('keeps the second option as 되돌리기', () => {
    expect(approvalOf(edit).secondary).toBe('그대로 두기')
  })
})

describe('restoreBotTurns (ChatResume)', () => {
  const turn = (id: string, events: BotContract.TurnEvent[], user?: string): BotContract.Turn =>
    ({ id, status: 'DONE', createdAt: ASKED, user: user ? { messageId: `m-${id}`, text: user, attachments: [] } : null, answer: null, events, assistant: null }) as BotContract.Turn
  const card = (id: string, over: Record<string, unknown>) =>
    ({ type: 'choice', id, title: `질문 ${id}`, options: [{ id: '0', label: '예' }, { id: '1', label: '아니오' }], seq: 1, at: ASKED, openedAt: ASKED, ...over }) as unknown as BotContract.TurnEvent

  it('draws an earlier turn card the server closed as the bot question, and the newest turn card stays open', () => {
    const state = restoreBotTurns([
      turn('t2', [card('open', { resolution: { status: 'PENDING', optionId: null }, expiresAt: null })], '새 이력서 만들어 줘'),
      turn('t1', [card('old', { resolution: { status: 'EXPIRED', optionId: null } })]),
    ])
    expect(state.items.map((i) => i.type)).toEqual(['stale', 'user'])
    expect(state.items[0]).toMatchObject({ type: 'stale', text: '질문 old' })
    expect(state.approval?.id).toBe('open')
  })

  it('keeps an old card that only passed its own time open, as no clock decides it', () => {
    const state = restoreBotTurns([turn('t2', [], '안녕'), turn('t1', [card('old', { resolution: { status: 'PENDING', optionId: null }, expiresAt: '2026-11-14T00:00:00.000Z' })])])
    expect(state.items.some((i) => i.type === 'stale')).toBe(false)
  })

  it('a reopened chat draws no waiting line for a stored choice card, a reattached run does', () => {
    const open = card('open', { resolution: { status: 'PENDING', optionId: null }, expiresAt: null })
    expect(restoreBotTurns([turn('t1', [open], 'hi')]).approval?.openedAt).toBeUndefined()
    expect(restoreBotTurns([turn('t1', [open], 'hi')], { turnId: 't1', lastSeq: 9 }).approval?.openedAt).toBe(Date.parse(ASKED))
  })
})
