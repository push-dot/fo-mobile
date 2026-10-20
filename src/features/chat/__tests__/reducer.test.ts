import { describe, expect, it } from 'vitest'
import { applyEvent, emptyChat, formatElapsed } from '../reducer'
import type { ChatEvent, ChatState } from '../types'

const run = (events: ChatEvent[], from: ChatState = emptyChat) => events.reduce(applyEvent, from)

describe('applyEvent', () => {
  it('upserts items by id so a running tool turns done in place', () => {
    const s = run([
      { type: 'tool', id: 't1', action: '공고 읽기', state: 'run' },
      { type: 'agentText', id: 'a1', text: '읽는 중' },
      { type: 'tool', id: 't1', action: '공고 읽기', state: 'ok', result: '필수 5개 · 우대 3개' },
    ])
    expect(s.items.map((i) => i.id)).toEqual(['t1', 'a1'])
    expect(s.items[0]).toMatchObject({ state: 'ok', result: '필수 5개 · 우대 3개' })
  })

  it('tracks working state from start through approval', () => {
    let s = run([{ type: 'start', at: 1000 }, { type: 'status', verbs: ['맞춰보는 중…'] }])
    expect(s.working).toEqual({ verbs: ['맞춰보는 중…'], startedAt: 1000 })
    s = applyEvent(s, { type: 'approval', approval: { id: 'ap', question: '바꿀까요?', sections: [] } })
    expect(s.working).toBeNull()
    expect(s.approval?.id).toBe('ap')
    s = applyEvent(s, { type: 'answer', text: '네, 반영해 주세요' })
    expect(s.approval).toBeNull()
    expect(s.items.at(-1)).toMatchObject({ type: 'user', text: '네, 반영해 주세요' })
  })

  it('appends streamed tokens to the last agent line only', () => {
    const s = run([
      { type: 'token', text: '좋아' },
      { type: 'token', text: '요.' },
      { type: 'tool', id: 't', action: '이력서 읽기', state: 'ok' },
      { type: 'token', text: '다음' },
    ])
    expect(s.items.filter((i) => i.type === 'agentText').map((i) => (i as { text: string }).text)).toEqual(['좋아요.', '다음'])
  })

  it('stop marks running tools interrupted and remembers it for the next message', () => {
    const s = run([
      { type: 'start', at: 0 },
      { type: 'tool', id: 'ok', action: '공고 읽기', state: 'ok' },
      { type: 'tool', id: 'r', action: '적합도 계산', state: 'run', result: '비교하는 중' },
      { type: 'stop' },
    ])
    expect(s.working).toBeNull()
    expect(s.interrupted).toBe(true)
    expect(s.items[0]).toMatchObject({ state: 'ok' })
    expect(s.items[1]).toMatchObject({ state: 'err', error: '중단됨 · 어떻게 할지 알려 주세요', result: undefined })
    expect(applyEvent(s, { type: 'start', at: 5 }).interrupted).toBe(false)
  })

  it('done adds the worked line with elapsed seconds', () => {
    const s = run([{ type: 'start', at: 0 }, { type: 'done', at: 72_000 }])
    expect(s.working).toBeNull()
    expect(s.items.at(-1)).toMatchObject({ type: 'worked', seconds: 72 })
    expect(formatElapsed(72)).toBe('1분 12초')
    expect(formatElapsed(14)).toBe('14초')
  })

  it('queues messages sent while working', () => {
    const s = run([{ type: 'queue', text: 'a' }, { type: 'queue', text: 'b' }, { type: 'dequeue' }])
    expect(s.queue).toEqual(['b'])
  })

  it('error ends the run and shows the message', () => {
    const s = run([{ type: 'start', at: 0 }, { type: 'error', id: 'e', text: '크레딧이 모자라요' }])
    expect(s.working).toBeNull()
    expect(s.items.at(-1)).toMatchObject({ type: 'error', text: '크레딧이 모자라요' })
  })
})
