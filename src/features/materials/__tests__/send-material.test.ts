import { beforeEach, describe, expect, it, vi } from 'vitest'

const nav = vi.hoisted(() => ({ push: vi.fn(), dismissTo: vi.fn() }))
const drafts = vi.hoisted(() => ({ byBot: {} as Record<string, string> }))
const toast = vi.hoisted(() => vi.fn())
vi.mock('expo-router', () => ({ router: nav }))
vi.mock('@/shared/components/toast-store', () => ({ showToast: toast }))
vi.mock('@/features/chat', () => ({ attach: (id: string, a: { title: string }) => void (drafts.byBot[id] = a.title) }))
// The bots barrel pulls in React Native; the route builders are the part under test.
vi.mock('@/features/bots', () => import('../../bots/utils/paths'))

import type { Bot, BotId } from '@/features/bots'
import type { Material } from '../types'
import { sendMaterial, sendToBot } from '../components/send-material'

const day = new Date(2026, 10, 2)
const file: Material = { kind: 'file', id: 'f1', title: 'a.pdf', mimeType: 'application/pdf', bytes: 1, pages: 1, madeBy: { by: 'user' }, updatedAt: day }
const bot = (id: string, kind: 'push' | 'company'): Bot =>
  ({ id: id as BotId, kind, name: id, muted: false, revision: 1, lastActivityAt: day, lastMessage: null, unread: false, activity: { phase: 'idle' }, ...(kind === 'company' ? { color: 'teal', postingId: null } : {}) }) as Bot

beforeEach(() => {
  vi.clearAllMocks()
  drafts.byBot = {}
})

describe('send a material to a bot', () => {
  it('from the bot home asks which bot and attaches nothing yet', () => {
    sendMaterial({ from: 'home' }, file)
    expect(toast).not.toHaveBeenCalled()
    expect(nav.push).toHaveBeenCalledWith('/bots/pick?kind=file&id=f1')
    expect(drafts.byBot).toEqual({})
  })

  it('from a bot attaches to that bot only and returns to its chat', () => {
    sendMaterial({ from: 'bot', botId: 'b1' as BotId }, file)
    expect(Object.keys(drafts.byBot)).toEqual(['b1'])
    expect(drafts.byBot.b1).toBe('a.pdf')
    expect(nav.dismissTo).toHaveBeenCalledWith('/bots/b1')
    expect(toast).toHaveBeenCalledWith({ message: '자료를 붙였어요', tone: 'success' })
  })

  it('the picked company bot gets the chip and its chat opens over the home', () => {
    sendToBot(bot('b2', 'company'), { kind: 'file', id: 'f1', title: 'a.pdf' })
    expect(Object.keys(drafts.byBot)).toEqual(['b2'])
    expect(nav.dismissTo).toHaveBeenCalledWith('/(app)/(stack)/(tabs)/(bots)/bots')
    expect(nav.push).toHaveBeenCalledWith('/bots/b2')
    expect(toast).toHaveBeenCalledWith({ message: '자료를 붙였어요', tone: 'success' })
  })

  it('the Push Bot opens by its address, the chip is under its id', () => {
    sendToBot(bot('p1', 'push'), { kind: 'file', id: 'f1', title: 'a.pdf' })
    expect(drafts.byBot.p1).toBe('a.pdf')
    expect(nav.push).toHaveBeenCalledWith('/bots/push')
  })
})
