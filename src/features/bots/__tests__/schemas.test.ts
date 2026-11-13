import { describe, expect, it } from 'vitest'
import type { BotContract } from '@push/api-client'
import { toBot, toBotProfile, toBots, toCompanyBot, toLinkCheck } from '../api/schemas'

const dto = (over: Partial<BotContract.Bot> = {}): BotContract.Bot => ({
  id: 'b1',
  kind: 'company',
  displayName: '모아페이',
  companyName: '모아페이',
  color: 'teal',
  postingId: 'p1',
  notificationsMuted: false,
  revision: 2,
  createdAt: '2026-11-01T00:00:00Z',
  lastActivityAt: '2026-11-09T05:50:00Z',
  lastMessage: { preview: '반영했어요', at: '2026-11-09T05:50:00Z', fromBot: true },
  unread: true,
  activity: null,
  outcome: null,
  ...over,
})

describe('toBot', () => {
  it('reads the outcome of a bot whose card ran out or whose run failed, and drops a row whose outcome date is unreadable', () => {
    expect(toBot(dto({ outcome: { kind: 'failed', at: '2026-11-09T05:00:00Z' } }))?.outcome).toEqual({ kind: 'failed', at: new Date('2026-11-09T05:00:00Z') })
    expect(toBot(dto({ outcome: { kind: 'expired', at: 'x' } }))).toBeNull()
  })

  it('reads a company bot with its colour, posting, and no run as idle', () => {
    expect(toBot(dto())).toEqual({
      id: 'b1',
      kind: 'company',
      name: '모아페이',
      color: 'teal',
      postingId: 'p1',
      muted: false,
      revision: 2,
      lastActivityAt: new Date('2026-11-09T05:50:00Z'),
      lastMessage: { preview: '반영했어요', fromBot: true },
      unread: true,
      activity: { phase: 'idle' },
      outcome: null,
    })
  })

  it('gives the Push Bot no colour and no posting', () => {
    const bot = toBot(dto({ kind: 'push', displayName: 'Push Bot', color: null, postingId: null }))
    expect(bot).not.toHaveProperty('color')
    expect(bot).not.toHaveProperty('postingId')
    expect(bot?.kind).toBe('push')
  })

  it('draws a colour it does not know in gray', () => {
    expect(toBot(dto({ color: 'mint' as BotContract.BotColor }))).toMatchObject({ color: 'gray' })
  })

  it('reads each phase with its own facts and dates', () => {
    const waiting = toBot(dto({ activity: { phase: 'waiting', since: '2026-11-09T05:50:00Z', for: 'confirm', cardId: 'c1', cardTitle: '열어도 될까요?', expiresAt: '2026-11-09T06:00:00Z' } }))
    expect(waiting?.activity).toEqual({ phase: 'waiting', since: new Date('2026-11-09T05:50:00Z'), for: 'confirm', cardId: 'c1', cardTitle: '열어도 될까요?', expiresAt: new Date('2026-11-09T06:00:00Z') })
    const queued = toBot(dto({ activity: { phase: 'queued', since: '2026-11-09T05:50:00Z', ahead: 2 } }))
    expect(queued?.activity).toEqual({ phase: 'queued', since: new Date('2026-11-09T05:50:00Z'), ahead: 2 })
  })

  it('drops a row whose dates do not parse instead of drawing it half-built', () => {
    expect(toBot(dto({ lastActivityAt: 'soon' }))).toBeNull()
    expect(toBot(dto({ activity: { phase: 'working', since: 'x', label: '쓰는 중' } }))).toBeNull()
    expect(toBots([dto({ lastActivityAt: 'soon' }), dto({ id: 'b2' })]).map((b) => b.id)).toEqual(['b2'])
  })

  it('refuses a Push Bot where a company bot was asked for', () => {
    expect(() => toCompanyBot(dto({ kind: 'push', color: null }))).toThrow()
  })
})

describe('toBotProfile and toLinkCheck', () => {
  it('reads a deadline as that calendar day in any zone, and a missing count as unknown', () => {
    const profile = toBotProfile({ ...dto(), posting: { id: 'p1', title: '백엔드 엔지니어', deadline: '2026-11-20', closed: false }, fit: { score: 8.1 } })
    expect(profile.posting?.deadline).toEqual(new Date(2026, 10, 20))
    expect(profile.fitScore).toBe(8.1)
    expect(profile.materialCount).toBeNull()
    expect(toLinkCheck({ status: 'not_a_posting' })).toEqual({ status: 'not_a_posting' })
  })
})
