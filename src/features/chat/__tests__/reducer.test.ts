import { describe, expect, it } from 'vitest'
import { applyEvent, emptyChat, formatElapsed } from '../utils/reducer'
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
    s = applyEvent(s, { type: 'approval', approval: { id: 'ap', question: '바꿀까요?', optionIds: [], sections: [] } })
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

  it('keeps earlier item references stable when appending tokens', () => {
    let s = run([{ type: 'user', id: 'u1', text: 'hi' }])
    const userRef = s.items[0]
    s = applyEvent(s, { type: 'token', text: '안' })
    expect(s.items[0]).toBe(userRef)
    const midRef = s.items[1]
    s = applyEvent(s, { type: 'token', text: '녕' })
    expect(s.items[0]).toBe(userRef)
    expect(s.items[1]).not.toBe(midRef)
    expect(s.items[1]).toMatchObject({ type: 'agentText', text: '안녕' })
  })

  it('stop ends the run with one notice line and remembers it for the next message', () => {
    const s = run([
      { type: 'start', at: 0 },
      { type: 'tool', id: 'ok', action: '공고 읽기', state: 'ok' },
      { type: 'tool', id: 'r', action: '적합도 계산', state: 'run', result: '비교하는 중' },
      { type: 'stop' },
    ])
    expect(s.working).toBeNull()
    expect(s.interrupted).toBe(true)
    expect(s.items.at(-1)).toMatchObject({ type: 'notice', notice: { kind: 'stopped', resumable: false } })
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
    expect(s.queue).toEqual([{ text: 'b' }])
  })

  it('error ends the run and shows the message', () => {
    const s = run([{ type: 'start', at: 0 }, { type: 'error', id: 'e', text: '크레딧이 모자라요' }])
    expect(s.working).toBeNull()
    expect(s.items.at(-1)).toMatchObject({ type: 'error', text: '크레딧이 모자라요' })
  })
})

describe('boost rounds on the fit bubble', () => {
  const round = (name: string, target: string, result: string) => ({ type: 'tool' as const, id: name, name, action: '점수 올리기', target, state: 'ok' as const, result })
  it('carries what the rounds since the last user line raised, and nothing from an earlier turn', () => {
    let s = emptyChat
    for (const e of [
      { type: 'user' as const, id: 'u0', text: '처음' },
      round('boost1', '이전', '5.0 → 5.5 · 예전'),
      { type: 'user' as const, id: 'u', text: '좋아요, 계속해 주세요' },
      round('boost1', '키워드 밀도', '6.9 → 7.8 · 키워드를 넣었어요'),
      round('boost2', '도메인 경험', '7.8 → 8.3 · 다시 썼어요'),
      { type: 'fit' as const, id: 'f', score: 8.3, from: 6.9, delta: '+1.4', note: 'x' },
    ]) s = applyEvent(s, e)
    expect(s.items.at(-1)).toMatchObject({ type: 'fit', rounds: [{ label: '키워드 밀도', line: '6.9 → 7.8 · 키워드를 넣었어요' }, { label: '도메인 경험', line: '7.8 → 8.3 · 다시 썼어요' }] })
  })
  it('leaves an analysis fit with no rounds', () => {
    const s = applyEvent(emptyChat, { type: 'fit', id: 'f', score: 6.9 })
    expect(s.items[0]).not.toHaveProperty('rounds')
  })
})
