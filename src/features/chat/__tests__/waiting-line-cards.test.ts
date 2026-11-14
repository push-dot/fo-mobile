import type { BotContract, StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { statusLineView } from '../utils/status-line'
import { waitingLine } from '../utils/card'
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
  it('opens a waiting line from the stamp and preselects nothing', () => {
    const card = approvalOf({ ...help, at: ASKED } as StreamEvent)
    expect(card.openedAt).toBe(Date.parse(ASKED))
    expect(card.sections[0]).toMatchObject({ selected: [] })
    expect(waitingLine(card, 'open')).toMatchObject({ kind: 'waiting', for: 'answer', text: '답을 기다리고 있어요' })
  })

  it('keeps its first pick, and no line, when the frame has no stamp', () => {
    const card = approvalOf(help)
    expect(card.openedAt).toBeUndefined()
    expect(card.sections[0]).toMatchObject({ selected: [0] })
    expect(waitingLine(card, 'open')).toBeNull()
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

  it('names the edit in its waiting line, with no elapsed time', () => {
    const card = approvalOf({ ...edit, at: ASKED } as StreamEvent)
    const line = waitingLine(card, 'open')!
    expect(line).toMatchObject({ for: 'confirm', text: '이력서 수정 · 확인을 기다리는 중', named: true })
    expect(statusLineView(line, new Date(Date.parse(ASKED) + 90_000))).toMatchObject({ text: '이력서 수정 · 확인을 기다리는 중', tail: null })
  })

  it('takes the server summary as the subject when there is one', () => {
    const card = approvalOf({ ...edit, summary: '자기소개서 수정', at: ASKED } as StreamEvent)
    expect(card.waitText).toBe('자기소개서 수정 · 확인을 기다리는 중')
  })

  it('draws no line without a stamp', () => {
    expect(waitingLine(approvalOf(edit), 'open')).toBeNull()
  })

  it('an ordinary waiting line still counts the seconds', () => {
    const line = waitingLine(approvalOf({ ...help, at: ASKED } as StreamEvent), 'open')!
    expect(statusLineView(line, new Date(Date.parse(ASKED) + 72_000))).toMatchObject({ tail: '1분 12초' })
  })
})

describe('restoreBotTurns (ChatResume)', () => {
  const turn = (id: string, events: BotContract.TurnEvent[], user?: string): BotContract.Turn =>
    ({ id, status: 'DONE', createdAt: ASKED, user: user ? { messageId: `m-${id}`, text: user, attachments: [] } : null, answer: null, events, assistant: null }) as BotContract.Turn
  const card = (id: string, over: Record<string, unknown>) =>
    ({ type: 'choice', id, title: `질문 ${id}`, options: [{ id: '0', label: '예' }, { id: '1', label: '아니오' }], seq: 1, at: ASKED, openedAt: ASKED, ...over }) as unknown as BotContract.TurnEvent
  const past = '2026-11-14T00:00:00.000Z'

  it('draws an earlier turn card that ran out as a 확인 대기 중 · 멈춤 line, and the newest turn card stays open', () => {
    const state = restoreBotTurns([
      turn('t2', [card('open', { resolution: { status: 'PENDING', optionId: null }, expiresAt: null })], '새 이력서 만들어 줘'),
      turn('t1', [card('old', { resolution: { status: 'PENDING', optionId: null }, expiresAt: past })]),
    ])
    expect(state.items.map((i) => i.type)).toEqual(['stale', 'user'])
    expect(state.items[0]).toMatchObject({ type: 'stale', text: '질문 old' })
    expect(state.approval?.id).toBe('open')
  })

  it('also reads the server EXPIRED status', () => {
    const state = restoreBotTurns([turn('t2', [], '안녕'), turn('t1', [card('old', { resolution: { status: 'EXPIRED', optionId: null } })])])
    expect(state.items[0]).toMatchObject({ type: 'stale', id: 'stale-old' })
  })

  it('a reopened chat draws no waiting line for a stored choice card, a reattached run does', () => {
    const open = card('open', { resolution: { status: 'PENDING', optionId: null }, expiresAt: null })
    expect(restoreBotTurns([turn('t1', [open], 'hi')]).approval?.openedAt).toBeUndefined()
    expect(restoreBotTurns([turn('t1', [open], 'hi')], { turnId: 't1', lastSeq: 9 }).approval?.openedAt).toBe(Date.parse(ASKED))
  })
})
