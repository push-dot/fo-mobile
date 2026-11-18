import { describe, expect, it, vi } from 'vitest'
import { notificationHref, notificationHrefFromPush } from './href'

vi.mock('@/features/bots', async () => {
  const { botChatPath, botHomePath } = await import('@/features/bots/utils/paths')
  return { botChatPath, botHomePath }
})

describe('notificationHref', () => {
  it('opens the screen named by the target', () => {
    expect(notificationHref({ target: { kind: 'posting', id: 'p1' } })).toBe('/postings/p1')
    expect(notificationHref({ target: { kind: 'offer', id: 'o1' } })).toBe('/offers/o1')
    expect(notificationHref({ target: { kind: 'post', id: 'po1' } })).toBe('/posts/po1')
    expect(notificationHref({ target: { kind: 'conversation', id: 'c1' } })).toBe('/(app)/(stack)/(tabs)/(bots)/bots')
  })

  it('opens my activity for calendar reminders and application stages', () => {
    expect(notificationHref({ target: { kind: 'calendar', id: 'e1' } })).toEqual({
      pathname: '/(app)/(stack)/(tabs)/(my)/my',
      params: { tab: 'activity', sub: 'calendar' },
    })
    expect(notificationHref({ target: { kind: 'activity', id: 'a1' } })).toEqual({
      pathname: '/(app)/(stack)/(tabs)/(my)/my',
      params: { tab: 'activity', sub: 'applications' },
    })
  })

  it('opens that bot when the notification target is a bot', () => {
    expect(notificationHref({ target: { kind: 'bot', id: 'b-moa' } })).toBe('/bots/b-moa')
  })

  it('opens that bot when a push tap carries the bot target', () => {
    expect(notificationHrefFromPush({ kind: 'bot', id: 'b-moa' })).toBe('/bots/b-moa')
    expect(notificationHrefFromPush(null)).toBeNull()
    expect(notificationHrefFromPush({ kind: 'bot' })).toBeNull()
  })

  it('returns null for an unknown target', () => {
    expect(notificationHref({ target: { kind: 'unknown' as never, id: 'x' } })).toBeNull()
  })
})
