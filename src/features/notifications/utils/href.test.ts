import { describe, expect, it } from 'vitest'
import { notificationHref } from './href'

describe('notificationHref', () => {
  it('opens the screen named by the target', () => {
    expect(notificationHref({ target: { kind: 'posting', id: 'p1' } })).toBe('/postings/p1')
    expect(notificationHref({ target: { kind: 'offer', id: 'o1' } })).toBe('/offers/o1')
    expect(notificationHref({ target: { kind: 'post', id: 'po1' } })).toBe('/posts/po1')
    expect(notificationHref({ target: { kind: 'conversation', id: 'c1' } })).toBe('/chat/c1')
  })

  it('opens my activity for calendar reminders and application stages', () => {
    expect(notificationHref({ target: { kind: 'calendar', id: 'e1' } })).toEqual({
      pathname: '/(tabs)/(my)/my',
      params: { tab: 'activity', sub: 'calendar' },
    })
    expect(notificationHref({ target: { kind: 'activity', id: 'a1' } })).toEqual({
      pathname: '/(tabs)/(my)/my',
      params: { tab: 'activity', sub: 'applications' },
    })
  })

  it('returns null for an unknown target', () => {
    expect(notificationHref({ target: { kind: 'unknown' as never, id: 'x' } })).toBeNull()
  })
})
