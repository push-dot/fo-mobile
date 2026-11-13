import type { StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { READ_OFF_TEXT } from '../constants'
import { applyEvent, emptyChat } from '../utils/reducer'
import { statusLineView } from '../utils/status-line'
import { fromStream, mapEvent } from '../utils/stream'
import { restoreBotTurns } from '../utils/turns'

const frames = async function* (list: { type: string; seq: number; turn: string; text?: string; code?: string }[]) {
  yield* list
}
const collect = async (source: ReturnType<typeof fromStream>) => {
  const out = []
  for await (const e of source) out.push(e)
  return out
}

describe('ChatPh3Review moved line', () => {
  const diff = (hunks: { line: number | null; sign: '+' | '-' | ''; text: string }[]) => mapEvent({ type: 'diff', documentId: 'd', revisionId: 'r', hunks } as StreamEvent)

  it('draws a line removed and added back with the same text as one ~ line, in the order the server sent', () => {
    const [item] = diff([
      { line: null, sign: '+', text: 'a' },
      { line: null, sign: '-', text: 'k' },
      { line: null, sign: '+', text: 'k' },
      { line: null, sign: '-', text: 'z' },
    ])
    expect(item).toMatchObject({ type: 'diff', lines: [{ sign: '+', text: 'a' }, { sign: '~', text: 'k' }, { sign: '-', text: 'z' }] })
  })

  it('pairs a removal that comes after its addition, and each removal once', () => {
    const [item] = diff([
      { line: 1, sign: '+', text: 'k' },
      { line: 2, sign: '+', text: 'k' },
      { line: 3, sign: '-', text: 'k' },
    ])
    expect(item).toMatchObject({ lines: [{ sign: '~', n: 1 }, { sign: '+', n: 2 }] })
  })

  it('leaves a plain change alone', () => {
    const [item] = diff([{ line: 12, sign: '-', text: 'a' }, { line: 12, sign: '+', text: 'b' }])
    expect(item).toMatchObject({ lines: [{ sign: '-' }, { sign: '+' }] })
  })
})

describe('ChatPh0Input', () => {
  it('draws no foot under a sectioned card; the multi-choice card keeps its own', () => {
    const [sectioned] = mapEvent({ type: 'choice', id: 'g', options: [], sections: [{ id: 'p', kind: 'chips', multiple: true, options: [{ id: 'a', label: '이력서' }], selected: [] }] } as StreamEvent)
    expect(sectioned?.type === 'approval' && sectioned.approval.foot).toBeUndefined()
    const [multi] = mapEvent({ type: 'choice', id: 'x', options: [{ id: 'a', label: '성능' }], multiple: true } as StreamEvent)
    expect(multi?.type === 'approval' && multi.approval.foot).toBe('여러 개 고를 수 있어요')
  })
})

describe('ChatBotReadOff', () => {
  const notice = { type: 'notice', seq: 2, turn: 't1', text: READ_OFF_TEXT }

  it('draws the refusal as one bubble per turn, with or without the code', async () => {
    const live = await collect(fromStream(frames([notice, { ...notice, seq: 3, text: 'x', code: 'read_switch_off' }]), async function* () {}))
    expect(live).toEqual([
      { type: 'readOff', id: 'read-off-t1', text: READ_OFF_TEXT },
      { type: 'readOff', id: 'read-off-t1', text: READ_OFF_TEXT },
    ])
    expect(live.reduce(applyEvent, emptyChat).items).toHaveLength(1)
  })

  it('draws any other notice as a failed-step line and keeps the same entry id after a reopen', () => {
    expect(mapEvent({ type: 'notice', text: '방향 검증에서 문제가 생겼어요', seq: 1 } as unknown as StreamEvent)).toEqual([
      { type: 'notice', id: 'notice-1', notice: { kind: 'failed', text: '방향 검증에서 문제가 생겼어요' } },
    ])
    const stored = restoreBotTurns([{ id: 't1', status: 'DONE', createdAt: '', user: null, answer: null, assistant: null, events: [{ type: 'notice', text: READ_OFF_TEXT, seq: 9, at: '' }] } as never])
    expect(stored.items).toEqual([{ type: 'readOff', id: 'read-off-t1', text: READ_OFF_TEXT }])
  })
})

describe('ChatInterrupt', () => {
  it('ends a stopped run with one grey line that says whether the next message continues the flow', () => {
    const run = { ...emptyChat, working: { verbs: ['x'], startedAt: 0 }, runStartedAt: 0 }
    const [stop] = mapEvent({ type: 'cancelled', resumable: true } as unknown as StreamEvent, 't1')
    const next = applyEvent(run, stop!)
    expect(next.items).toEqual([{ type: 'notice', id: 'stopped-t1', notice: { kind: 'stopped', resumable: true } }])
    expect(applyEvent(next, stop!).items).toHaveLength(1)
    const afterCancelPost = applyEvent(run, { type: 'stop', resumable: true })
    expect(applyEvent(afterCancelPost, stop!).items).toEqual(next.items)
    expect(statusLineView({ kind: 'stopped', resumable: true }, new Date())).toMatchObject({ text: '작업을 중지했어요 · 어떻게 할지 알려 주세요', tone: 'quiet' })
  })
})
