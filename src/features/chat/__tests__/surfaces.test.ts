import type { A2uiFrame, BotContract, StreamEvent } from '@push/api-client'
import approvalEdit from '@push/api-client/a2ui-fixtures/approval-edit.json'
import approvalEditAnswered from '@push/api-client/a2ui-fixtures/approval-edit-answered.json'
import choiceSections from '@push/api-client/a2ui-fixtures/choice-sections.json'
import choiceSingle from '@push/api-client/a2ui-fixtures/choice-single.json'
import choiceSingleAnswered from '@push/api-client/a2ui-fixtures/choice-single-answered.json'
import resultSaveFailed from '@push/api-client/a2ui-fixtures/result-save-failed.json'
import todo from '@push/api-client/a2ui-fixtures/todo.json'
import approvalEditV1 from '@push/api-client/a2ui-fixtures/v1.0/approval-edit.json'
import { describe, expect, it } from 'vitest'
import { applyEvent, emptyChat } from '../utils/reducer'
import { fromStream, mapEvent } from '../utils/stream'
import { dataModel, type SurfaceItem } from '../utils/surface'
import { restoreBotTurns } from '../utils/turns'
import type { ChatEvent, ChatState } from '../types'

const frame = (json: unknown) => json as A2uiFrame & StreamEvent
/** The fixtures share one surface id: a copy under another, everywhere it is named. */
const as = (json: { surfaceId: string }, id: string) => JSON.parse(JSON.stringify(json).replaceAll(`"${json.surfaceId}"`, JSON.stringify(id))) as A2uiFrame & StreamEvent
const run = (events: ChatEvent[], from: ChatState = emptyChat) => events.reduce(applyEvent, from)
const play = (...frames: StreamEvent[]) => run(frames.flatMap((f) => mapEvent(f)))
const surface = (s: ChatState, id: string) => s.items.find((i): i is SurfaceItem => i.type === 'surface' && i.id === id)!
const waitingStatus = (cardId: string) => ({ type: 'status', text: '확인을 기다리고 있어요', phase: 'waiting', cardId }) as unknown as StreamEvent
const done = (awaiting?: 'approval' | 'choice') => ({ type: 'done', operation: null, ...(awaiting ? { awaiting } : {}) }) as StreamEvent

describe('a2ui frames in the chat', () => {
  it('maps a frame to one surface row with its messages', () => {
    const [row] = mapEvent(frame(todo))
    expect(row).toEqual({ type: 'surface', id: todo.surfaceId, kind: 'todo', messages: todo.messages })
  })

  it('upserts by surfaceId: a repeated frame drops its createSurface and adds the rest in order', () => {
    const later = { ...todo, messages: todo.messages.map((m) => ('updateDataModel' in m ? { ...m, updateDataModel: { ...m.updateDataModel, value: { items: [{ text: '이력서 읽기', state: 'done' }] } } } : m)) }
    const s = play(frame(todo), frame(later))
    const row = surface(s, todo.surfaceId)
    expect(s.items.filter((i) => i.type === 'surface')).toHaveLength(1)
    expect(row.messages.filter((m) => 'createSurface' in m)).toHaveLength(1)
    expect(row.messages).toHaveLength(5)
    expect(dataModel(row)).toEqual({ items: [{ text: '이력서 읽기', state: 'done' }] })
  })

  it('waits on the surface the waiting status names, and only until the run goes on', () => {
    let s = play(frame(choiceSingle), waitingStatus(choiceSingle.surfaceId), done('choice'))
    expect(s.waiting).toBe(choiceSingle.surfaceId)
    expect(s.awaiting).toBe('choice')
    s = applyEvent(s, { type: 'start', at: 1 })
    expect(s.waiting).toBeNull()
  })

  it('waits on the surface the latest waiting status named, not on a newer gate of the same run', () => {
    const s = play(frame(approvalEdit), waitingStatus(approvalEdit.surfaceId), as(choiceSections, 'later'), done('approval'))
    expect(s.waiting).toBe(approvalEdit.surfaceId)
  })

  it('never waits on a gate an earlier run left open', () => {
    let s = play(as(choiceSingle, 'left-open'))
    s = run([{ type: 'stop', resumable: false }, { type: 'user', id: 'u2', text: '다시 해 줘' }, { type: 'start', at: 2 }], s)
    s = run(mapEvent(done('choice')), s)
    expect(s.waiting).toBeNull()
    expect(s.awaiting).toBe('choice')
  })

  it('falls back to the newest open gate when a paused run named none', () => {
    const s = play(frame(approvalEdit), as(choiceSections, 'later'), done('choice'))
    expect(s.waiting).toBe('later')
    expect(play(frame(approvalEdit), done()).waiting).toBeNull()
  })

  it('closes an answered surface in place with what was picked, in the surface protocol version, and reopens it when the answer failed', () => {
    for (const fixture of [approvalEdit, approvalEditV1]) {
      let s = play(frame(fixture), waitingStatus(fixture.surfaceId), done('approval'))
      s = applyEvent(s, { type: 'answer', surfaceId: fixture.surfaceId, picked: ['apply'] })
      expect(s.waiting).toBeNull()
      const row = surface(s, fixture.surfaceId)
      expect(dataModel(row)).toMatchObject({ open: false, picked: ['apply'] })
      expect(row.messages.slice(-2).every((m) => m.version === fixture.messages[0]!.version)).toBe(true)
      s = applyEvent(s, { type: 'reopen', surfaceId: fixture.surfaceId })
      expect(s.waiting).toBe(fixture.surfaceId)
      expect(dataModel(surface(s, fixture.surfaceId))).toMatchObject({ open: true, picked: [] })
    }
  })

  it('patches nothing but the surface it names', () => {
    const s = run([{ type: 'answer', surfaceId: 'other', picked: ['x'] }], play(frame(todo), as(resultSaveFailed, 'result')))
    expect(surface(s, todo.surfaceId).messages).toEqual(todo.messages)
  })
})

describe('restoreBotTurns', () => {
  const turn = (id: string, events: unknown[], status: BotContract.Turn['status'] = 'DONE'): BotContract.Turn => ({
    id,
    status,
    createdAt: '2026-11-23T00:00:00Z',
    user: { messageId: `${id}-u`, text: '해 줘', attachments: [] },
    answer: null,
    events: events.map((e, i) => ({ ...(e as object), seq: i + 1, at: '2026-11-23T00:00:00Z' })) as BotContract.TurnEvent[],
    assistant: null,
  })

  it('replays an answered surface answered, and waits only on the newest turn\'s open gate', () => {
    const older = turn('t1', [as(choiceSingleAnswered, 'answered'), as(choiceSingle, 'stale-open')])
    const newest = turn('t2', [{ type: 'token', text: '고쳤어요' }, as(approvalEdit, 'edit')])
    const s = restoreBotTurns([newest, older])
    expect(dataModel(surface(s, 'answered'))).toMatchObject({ open: false, picked: ['ready'] })
    expect(s.waiting).toBe('edit')
    expect(s.items.map((i) => i.type)).toEqual(['user', 'surface', 'surface', 'user', 'agentText', 'surface'])
  })

  it('waits on nothing when the newest gate was answered or its turn failed', () => {
    expect(restoreBotTurns([turn('t1', [approvalEditAnswered])]).waiting).toBeNull()
    expect(restoreBotTurns([turn('t1', [approvalEdit], 'FAILED')]).waiting).toBeNull()
  })

  it('waits on nothing when the newest turn was cancelled with its gate still open', () => {
    expect(restoreBotTurns([turn('t1', [approvalEdit], 'CANCELLED')]).waiting).toBeNull()
  })

  it('does not wait on an older turn\'s gate when the newest turn sent none', () => {
    const older = turn('t1', [as(choiceSingle, 'stale-open')])
    const newest = turn('t2', [{ type: 'token', text: '다른 걸 할게요' }])
    const s = restoreBotTurns([newest, older])
    expect(dataModel(surface(s, 'stale-open'))).toMatchObject({ open: true })
    expect(s.waiting).toBeNull()
  })

  it('waits on the surface the newest turn\'s waiting status names, as the live stream does', () => {
    const newest = turn('t1', [waitingStatus('first'), as(approvalEdit, 'first'), as(choiceSingle, 'second')])
    expect(restoreBotTurns([newest]).waiting).toBe('first')
  })
})

describe('stream frames around the cards', () => {
  it('drops a frame type this build does not know and keeps the next frame', async () => {
    expect(mapEvent({ type: 'nope' } as unknown as StreamEvent)).toEqual([])
    async function* frames(): AsyncGenerator<StreamEvent> {
      yield { type: 'nope' } as unknown as StreamEvent
      yield { type: 'token', text: '계속', seq: 1 }
      yield { type: 'done', operation: null, seq: 2 }
    }
    const out = []
    for await (const event of fromStream(frames(), async function* () {})) out.push(event)
    expect(out.map((event) => event.type)).toEqual(['token', 'done'])
  })

  it("keeps a tool line's target, result line, extra lines and warning", () => {
    const s = play(
      { type: 'tool', name: 'explore_github', state: 'run', summary: 'GitHub 살펴보기', target: 'seojun-kim' } as StreamEvent,
      {
        type: 'tool', name: 'explore_github', state: 'ok', summary: 'GitHub 살펴보기', target: 'seojun-kim',
        resultLine: '저장소 12개 중 공고 관련 3개', extra: ['payment-retry-lab', 'settle-pipeline'], warning: '한 번 더 시도했어요',
      } as StreamEvent,
    )
    expect(s.items).toHaveLength(1)
    expect(s.items[0]).toMatchObject({
      type: 'tool', action: 'GitHub 살펴보기', target: 'seojun-kim', state: 'ok',
      result: '저장소 12개 중 공고 관련 3개', extra: ['payment-retry-lab', 'settle-pipeline'], warning: '한 번 더 시도했어요',
    })
  })
})
