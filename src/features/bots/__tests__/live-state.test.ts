import { describe, expect, it } from 'vitest'
import type { Bot, BotActivity, BotId, CardId, CompanyBot, LocalActivity, MascotState } from '../types'
import { LIVE_POLL_MS } from '../constants'
import { botRow, expiredAt, mascotStateOf, mergeFacts, pollIntervalOf } from '../utils/live-state'

const now = new Date(2026, 10, 9, 15, 0)
const minAgo = (m: number) => new Date(now.getTime() - m * 60_000)
const since = minAgo(2)

const ACTIVITY: Record<BotActivity['phase'], BotActivity> = {
  idle: { phase: 'idle' },
  queued: { phase: 'queued', since, ahead: 1 },
  thinking: { phase: 'thinking', since, label: null },
  working: { phase: 'working', since, label: '경력 섹션 고치는 중' },
  waiting: { phase: 'waiting', since, for: 'confirm', cardId: 'card1' as CardId, cardTitle: '이 변경을 이력서에 반영할까요?', expiresAt: null },
}

const bot = (over: Partial<CompanyBot> = {}): CompanyBot => ({
  id: 'b1' as BotId,
  kind: 'company',
  name: '모아페이',
  color: 'teal',
  postingId: 'p1',
  muted: false,
  revision: 1,
  lastActivityAt: minAgo(10),
  lastMessage: { preview: '지원 동기 문단을 줄였어요', fromBot: true },
  unread: false,
  activity: { phase: 'idle' },
  outcome: null,
  ...over,
})

describe('mascotStateOf', () => {
  // AgentHomeMascot: 확인 필요 → 완료 안 읽음 → 작업 중 → 생각 중 → 대기, one state per bot.
  const expected: [BotActivity['phase'], boolean, MascotState][] = [
    ['waiting', true, 'help'],
    ['waiting', false, 'help'],
    ['working', true, 'done'],
    ['thinking', true, 'done'],
    ['queued', true, 'done'],
    ['idle', true, 'done'],
    ['working', false, 'work'],
    ['thinking', false, 'think'],
    ['queued', false, 'think'],
    ['idle', false, 'idle'],
  ]

  it.each(expected)('%s with unread %s shows %s', (phase, unread, state) => {
    expect(mascotStateOf({ activity: ACTIVITY[phase], unread, outcome: null })).toBe(state)
  })
})

describe('expiredAt', () => {
  const waiting = (expiresAt: Date | null): BotActivity => ({ ...(ACTIVITY.waiting as Extract<BotActivity, { phase: 'waiting' }>), expiresAt })

  it('drops a card whose time has come, and keeps one still open or without a time', () => {
    expect(expiredAt(waiting(minAgo(0)), now)).toEqual({ phase: 'idle' })
    expect(expiredAt(waiting(minAgo(-1)), now).phase).toBe('waiting')
    expect(expiredAt(waiting(null), now).phase).toBe('waiting')
  })

  it('leaves every other phase alone', () => {
    expect(expiredAt(ACTIVITY.working, now)).toBe(ACTIVITY.working)
  })
})

describe('mergeFacts', () => {
  it('takes the session stream over the list answer', () => {
    const local: LocalActivity = { streaming: ACTIVITY.working, reading: false }
    expect(mergeFacts(bot({ activity: ACTIVITY.queued }), local, now).activity).toBe(ACTIVITY.working)
  })

  it('takes the server answer when the session holds no stream, with an expired card dropped', () => {
    const card = { ...ACTIVITY.waiting, expiresAt: minAgo(1) } as BotActivity
    expect(mergeFacts(bot({ activity: ACTIVITY.thinking }), { reading: false }, now).activity).toBe(ACTIVITY.thinking)
    expect(mergeFacts(bot({ activity: card }), undefined, now).activity).toEqual({ phase: 'idle' })
  })

  it('reads nothing as unread while the user is in the chat', () => {
    expect(mergeFacts(bot({ unread: true }), { reading: true }, now).unread).toBe(false)
    expect(mergeFacts(bot({ unread: true }), { reading: false }, now).unread).toBe(true)
    expect(mergeFacts(bot({ unread: true }), undefined, now).unread).toBe(true)
  })
})

describe('pollIntervalOf', () => {
  const list = (...phases: BotActivity['phase'][]): Bot[] => phases.map((p, i) => bot({ id: `b${i}` as BotId, activity: ACTIVITY[p] }))

  it.each(['queued', 'thinking', 'working'] as const)('polls while the home is live and a bot is %s', (phase) => {
    expect(pollIntervalOf(list('idle', phase), true)).toBe(LIVE_POLL_MS)
  })

  it('does not poll for a bot that only waits for the user, for idle bots, or when the home is not live', () => {
    expect(pollIntervalOf(list('waiting', 'idle'), true)).toBe(false)
    expect(pollIntervalOf(list('working'), false)).toBe(false)
    expect(pollIntervalOf(undefined, true)).toBe(false)
  })
})

describe('botRow', () => {
  // The AgentHome board, row for row.
  it.each([
    [bot({ activity: ACTIVITY.waiting }), '이 변경을 이력서에 반영할까요?', 'help', '10분 전'],
    [bot({ name: '도토리증권', activity: ACTIVITY.working, lastActivityAt: minAgo(60) }), '경력 섹션 고치는 중', 'work', '1시간 전'],
    [bot({ name: '파도AI', activity: { phase: 'thinking', since, label: '공고 요건을 살펴보는 중' }, lastActivityAt: minAgo(0) }), '공고 요건을 살펴보는 중', 'think', '방금'],
    [bot({ name: '누리클라우드', unread: true, lastMessage: { preview: '자기소개서 초안 v2를 만들었어요', fromBot: true }, lastActivityAt: minAgo(26 * 60) }), '자기소개서 초안 v2를 만들었어요', 'done', '어제'],
    [bot({ name: '한빛모빌리티', lastMessage: { preview: '면접 예상 질문 12개를 정리했어요', fromBot: true }, lastActivityAt: new Date(2026, 9, 28, 9) }), '면접 예상 질문 12개를 정리했어요', 'idle', '10월 28일'],
  ])('draws %#: line, mascot, and time', (b, line, mascot, time) => {
    const row = botRow(b, undefined, now)
    expect(row).toMatchObject({ line, mascot, time, unreadDot: mascot === 'done' })
  })

  it('keeps the posting line of a thinking bot that has no working sentence yet', () => {
    expect(botRow(bot({ activity: ACTIVITY.thinking }), undefined, now).line).toBe('지원 동기 문단을 줄였어요')
  })

  it('is empty for a bot nobody has talked to, and shows the year of an older day', () => {
    const row = botRow(bot({ lastMessage: null, lastActivityAt: new Date(2025, 11, 3, 9) }), undefined, now)
    expect(row.line).toBe('')
    expect(row.time).toBe('2025. 12. 3.')
  })

  it('draws the Push Bot body and says the state that has no visible label', () => {
    const push: Bot = { ...bot({ unread: true }), kind: 'push', name: 'Push Bot' }
    expect(botRow(push, undefined, now)).toMatchObject({ color: 'push', accessibilityLabel: 'Push Bot, 완료 안 읽음' })
    expect(botRow(bot({ activity: ACTIVITY.waiting }), undefined, now).accessibilityLabel).toBe('모아페이 Bot, 확인 필요, 이 변경을 이력서에 반영할까요?, 10분 전')
  })

  it('reads a search hit the way it is drawn: the matched line replaces the last message', () => {
    const row = botRow(bot({ activity: ACTIVITY.waiting }), undefined, now, '모아페이 · 백엔드 엔지니어')
    expect(row.line).toBe('모아페이 · 백엔드 엔지니어')
    expect(row.accessibilityLabel).toBe('모아페이 Bot, 확인 필요, 모아페이 · 백엔드 엔지니어, 10분 전')
    expect(botRow(bot({ activity: ACTIVITY.waiting }), undefined, now, '').line).toBe('이 변경을 이력서에 반영할까요?')
  })

  it('follows this session over the list: a stream in progress and a chat open at its bottom', () => {
    const row = botRow(bot({ unread: true }), { streaming: ACTIVITY.working, reading: true }, now)
    expect(row).toMatchObject({ mascot: 'work', line: '경력 섹션 고치는 중', unreadDot: false })
  })
})

describe('botRow outcome (AgentHomeRowExpiredFailed)', () => {
  const ended = (kind: 'expired' | 'failed') => bot({ outcome: { kind, at: minAgo(10) } })

  it('draws an expired card as an idle row with its line and no state word', () => {
    expect(botRow(ended('expired'), undefined, now)).toMatchObject({
      mascot: 'idle',
      line: '승인 요청이 만료됐어요',
      accessibilityLabel: '모아페이 Bot, 승인 요청이 만료됐어요, 10분 전',
    })
  })

  it('draws a failed run as 확인 필요 with its retry line', () => {
    expect(botRow(ended('failed'), undefined, now)).toMatchObject({
      mascot: 'help',
      line: '작업을 끝내지 못했어요. 다시 시도해 주세요.',
      accessibilityLabel: '모아페이 Bot, 확인 필요, 작업을 끝내지 못했어요. 다시 시도해 주세요., 10분 전',
    })
  })

  it('lets this session\'s stream replace the outcome until the next fetch', () => {
    const row = botRow(ended('failed'), { streaming: ACTIVITY.working, reading: false }, now)
    expect(row).toMatchObject({ mascot: 'work', line: '경력 섹션 고치는 중' })
  })
})
