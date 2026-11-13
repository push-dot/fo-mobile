import { describe, expect, it } from 'vitest'
import type { BotContract } from '@push/api-client'
import { botDtoOf, type BotFixture, type MockJob } from '../bots'

// The named cases of contract.md section 7. push-be runs the same table against bot_state_v on real Postgres.
const now = new Date('2026-11-09T06:00:00Z')

const base = (over: Partial<BotFixture> = {}): BotFixture => ({
  bot: { id: 'b1', kind: 'company', displayName: '모아페이', companyName: '모아페이', color: 'teal', postingId: 'p1', notificationsMuted: false, revision: 1, createdAt: '2026-11-01T00:00:00Z' },
  detail: { posting: null, fit: null },
  readAt: null,
  messages: [],
  cards: [],
  job: null,
  ...over,
})

const user = (at: number) => ({ id: `u${at}`, turn: `t${at}`, role: 'USER' as const, text: '공고에 맞춰 줘', at })
const bot = (at: number) => ({ id: `a${at}`, turn: `t${at}`, role: 'ASSISTANT' as const, text: '정리했어요', at })
const card = (at: number, expiresAt: number | null = null) => ({
  id: 'c1', turn: `t${at}`, for: 'confirm' as const, title: '이 변경을 이력서에 반영할까요?', status: 'PENDING' as const, at, expiresAt,
  options: [{ id: 'approve', label: '반영하기' }],
})
const running = (statuses: MockJob['statuses'], status: MockJob['status'] = 'RUNNING'): MockJob => ({ turn: 't9', at: 9, status, statuses })
const since = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString()

type Case = [name: string, fixture: BotFixture, activity: BotContract.BotActivity | null, unread: boolean]

const cases: Case[] = [
  ['fresh', base({ messages: [user(30)] }), null, false],
  ['read', base({ messages: [user(30), bot(29)], readAt: 20 }), null, false],
  ['own-message', base({ messages: [user(30), bot(29), user(10)], readAt: 20 }), null, false],
  ['unread', base({ messages: [user(30), bot(29)], readAt: 40 }), null, true],
  ['claimed', base({ messages: [user(9)], job: running([{ phase: 'queued', text: '대기 중' }]) }), { phase: 'thinking', since: since(9), label: null }, false],
  ['legacy-run', base({ messages: [user(9)], job: running([{ text: '생각 중' }]) }), { phase: 'thinking', since: since(9), label: null }, false],
  ['working', base({ messages: [user(9)], job: running([{ phase: 'queued', text: '대기 중' }, { phase: 'working', text: '공고 요건을 읽는 중' }]) }), { phase: 'working', since: since(9), label: '공고 요건을 읽는 중' }, false],
  [
    'thinking-after-work',
    base({ messages: [user(9)], job: running([{ phase: 'working', text: '공고 요건을 읽는 중' }, { phase: 'thinking', text: '생각 중' }]) }),
    { phase: 'thinking', since: since(9), label: '공고 요건을 읽는 중' },
    false,
  ],
  ['card', base({ messages: [user(12)], cards: [card(10)], readAt: 11 }), { phase: 'waiting', since: since(10), for: 'confirm', cardId: 'c1', cardTitle: '이 변경을 이력서에 반영할까요?', expiresAt: null }, true],
  ['card-read', base({ messages: [user(12)], cards: [card(10)], readAt: 5 }), { phase: 'waiting', since: since(10), for: 'confirm', cardId: 'c1', cardTitle: '이 변경을 이력서에 반영할까요?', expiresAt: null }, false],
  ['card-expired', base({ messages: [user(12)], cards: [card(11, 1)], readAt: 5 }), null, false],
  // Asked again 2 minutes ago, after the user last read the chat: the card counts from the retry.
  ['card-retried', base({ messages: [user(30)], cards: [card(2, -8)], readAt: 20 }), { phase: 'waiting', since: since(2), for: 'confirm', cardId: 'c1', cardTitle: '이 변경을 이력서에 반영할까요?', expiresAt: since(-8) }, true],
  ['unread-and-working', base({ messages: [user(30), bot(25), user(9)], readAt: 28, job: running([{ phase: 'working', text: '경력 섹션 고치는 중' }]) }), { phase: 'working', since: since(9), label: '경력 섹션 고치는 중' }, true],
]

describe('botDtoOf, the mock twin of bot_state_v', () => {
  it.each(cases)('%s', (_name, fixture, activity, unread) => {
    const dto = botDtoOf(fixture, now)
    expect(dto.activity).toEqual(activity)
    expect(dto.unread).toBe(unread)
  })

  it('queued: counts the active runs of the user that started earlier', () => {
    const earlier = base({ bot: { ...base().bot, id: 'b0' }, job: running([{ phase: 'working', text: '쓰는 중' }]) })
    const queued = base({ messages: [user(3)], job: { turn: 't3', at: 3, status: 'QUEUED', statuses: [{ phase: 'queued', text: '대기 중' }] } })
    expect(botDtoOf(queued, now, [earlier, queued]).activity).toEqual({ phase: 'queued', since: since(3), ahead: 1 })
    expect(botDtoOf(queued, now).activity).toEqual({ phase: 'queued', since: since(3), ahead: 0 })
  })

  it('no-thread: no line and the bot creation as its time', () => {
    const dto = botDtoOf(base(), now)
    expect(dto).toMatchObject({ activity: null, unread: false, lastMessage: null, lastActivityAt: '2026-11-01T00:00:00.000Z' })
  })

  it('takes the newest message for the line and the open card for the time', () => {
    const dto = botDtoOf(base({ messages: [user(30), bot(29)], cards: [card(10)] }), now)
    expect(dto.lastMessage).toEqual({ preview: '정리했어요', at: since(29), fromBot: true })
    expect(dto.lastActivityAt).toBe(since(10))
  })
})

describe('outcome', () => {
  const outcome = (f: BotFixture) => botDtoOf(f, now).outcome

  it('says expired once an unanswered card passes its time, and failed after a failed run', () => {
    expect(outcome(base({ messages: [user(30)], cards: [card(20, 10)] }))).toEqual({ kind: 'expired', at: since(10) })
    expect(outcome(base({ messages: [user(30), bot(29)], failedAt: 15 }))).toEqual({ kind: 'failed', at: since(15) })
  })

  it('is null while a card is open or a run is under way, and after anything newer', () => {
    expect(outcome(base({ messages: [user(30)], cards: [card(20, -5)] }))).toBeNull()
    expect(outcome(base({ messages: [user(9)], failedAt: 15, job: running([{ text: '생각 중' }]) }))).toBeNull()
    expect(outcome(base({ messages: [user(30), user(5)], failedAt: 15 }))).toBeNull()
  })
})
