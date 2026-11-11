import { describe, expect, it } from 'vitest'
import type { Bot } from '@push/api-client'
import {
  applyBotPatch,
  insertCreatedBot,
  markBotReadInList,
  mergeServerBot,
  unreadBotCount,
  withoutBot,
} from './cache'

const base = (over: Partial<Bot> = {}): Bot => ({
  id: 'c1',
  kind: 'company',
  displayName: 'A',
  companyId: null,
  companyName: 'Co',
  postingId: null,
  postingUrl: null,
  avatarKey: 'av',
  mascotKey: null,
  notificationsMuted: false,
  revision: 3,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-05T00:00:00Z',
  lastMessagePreview: 'prev',
  unread: true,
  status: 'RUNNING',
  ...over,
})

describe('bots cache', () => {
  it('applyBotPatch changes name and mute, keeps revision; null avatar clears', () => {
    const bot = base()
    const patched = applyBotPatch(bot, { displayName: 'B', notificationsMuted: true, avatarKey: null })
    expect(patched.displayName).toBe('B')
    expect(patched.notificationsMuted).toBe(true)
    expect(patched.revision).toBe(3)
    expect(patched.avatarKey).toBeNull()
  })

  it('mergeServerBot keeps preview, unread, and status from previous', () => {
    const prev = base({ lastMessagePreview: 'keep', unread: true, status: 'RUNNING' })
    const server = base({
      revision: 4,
      displayName: 'server',
      lastMessagePreview: '',
      unread: false,
      status: 'DONE',
    })
    const merged = mergeServerBot(prev, server)
    expect(merged.revision).toBe(4)
    expect(merged.displayName).toBe('server')
    expect(merged.lastMessagePreview).toBe('keep')
    expect(merged.unread).toBe(true)
    expect(merged.status).toBe('RUNNING')
  })

  it('insertCreatedBot orders push first and companies by updatedAt', () => {
    const push = base({ id: 'push', kind: 'push', updatedAt: '2020-01-01T00:00:00Z' })
    const old = base({ id: 'old', updatedAt: '2026-01-01T00:00:00Z' })
    const newer = base({ id: 'new', updatedAt: '2026-01-10T00:00:00Z' })
    const created = base({ id: 'created', updatedAt: '2026-01-08T00:00:00Z' })
    const list = insertCreatedBot([push, old, newer], created)
    expect(list.map((b) => b.id)).toEqual(['push', 'new', 'created', 'old'])
    const again = insertCreatedBot(list, created)
    expect(again.filter((b) => b.id === 'created')).toHaveLength(1)
  })

  it('withoutBot removes one id', () => {
    const bots = [base({ id: 'a' }), base({ id: 'b' })]
    expect(withoutBot(bots, 'a').map((b) => b.id)).toEqual(['b'])
  })

  it('markBotReadInList only clears unread on the target', () => {
    const bots = [base({ id: 'a', unread: true }), base({ id: 'b', unread: true })]
    const next = markBotReadInList(bots, 'a')
    expect(next[0]?.unread).toBe(false)
    expect(next[1]?.unread).toBe(true)
  })

  it('unreadBotCount counts unread bots; undefined is zero', () => {
    expect(unreadBotCount(undefined)).toBe(0)
    expect(unreadBotCount([base({ unread: true }), base({ id: '2', unread: false })])).toBe(1)
  })
})
