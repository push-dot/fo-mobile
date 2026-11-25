import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bot, BotId } from '@/features/bots'

vi.mock('@/features/bots', async () => ({
  ...(await import('@/features/bots/utils/live-state')),
  useMarkBotRead: vi.fn(),
}))

const { botRow } = await import('@/features/bots/utils/live-state')
vi.mock('@/shared/infrastructure', () => ({ api: {}, botApi: {}, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/shared/infrastructure/sources', () => ({ sourcesApi: {} }))
vi.mock('../api/fetchers', () => ({ chatApi: {} }))

const { setReading, useReadingStore } = await import('../stores')

const now = new Date(2026, 10, 16, 15, 0)
const bot = (id: string, unread: boolean): Bot =>
  ({
    id: id as BotId,
    kind: 'company',
    name: '누리클라우드',
    color: 'teal',
    postingId: 'p1',
    muted: false,
    revision: 1,
    lastActivityAt: new Date(now.getTime() - 600_000),
    lastMessage: { preview: '자기소개서 초안 v2를 만들었어요', fromBot: true },
    unread,
    activity: { phase: 'idle' },
    outcome: null,
  }) as Bot

const row = (b: Bot) => botRow(b, useReadingStore.getState().byBot[b.id], now)

describe('opening a chat clears its Bot home unread mark', () => {
  beforeEach(() => useReadingStore.setState({ byBot: {} }))

  it('shows the row unread until its chat is open, and unread again only if the server says so', () => {
    const unread = bot('b1', true)
    expect(row(unread).unreadDot).toBe(true)
    setReading(unread.id, true)
    expect(row(unread).unreadDot).toBe(false)
    expect(row(unread).mascot).toBe('idle')
    setReading(unread.id, false)
    expect(row(unread).unreadDot).toBe(true)
  })

  it('only the open chat is read, not its neighbours', () => {
    setReading('b1' as BotId, true)
    expect(row(bot('b2', true)).unreadDot).toBe(true)
  })

  it('keeps the map when nothing changes, so the home does not re-render', () => {
    setReading('b1' as BotId, true)
    const before = useReadingStore.getState().byBot
    setReading('b1' as BotId, true)
    setReading('b9' as BotId, false)
    expect(useReadingStore.getState().byBot).toBe(before)
  })
})
