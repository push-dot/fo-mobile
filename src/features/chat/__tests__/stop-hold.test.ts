import { describe, expect, it, vi } from 'vitest'
import { emptyChat } from '../utils/reducer'

const api = vi.hoisted(() => ({ conversations: {}, me: {} }))
vi.mock('@/shared/infrastructure', () => ({ api, botApi: { bots: {} }, http: {}, API_MOCK: true, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: {} }))
vi.mock('../api/fetchers', () => ({ chatApi: {} }))
vi.mock('@/shared/components/toast-store', () => ({ showToast: vi.fn() }))

const { holdMockStop, nextMockStep, stop, useChatStore } = await import('../stores')

const prime = () => useChatStore.setState({ chats: { c1: { ...emptyChat, working: { verbs: ['공고 요건을 읽는 중'], startedAt: 1 }, runStartedAt: 1 } } })

describe('a held mock stop (ChatBotStatusStopped)', () => {
  it('stays on 중지하는 중 until step-next, then ends once', () => {
    prime()
    holdMockStop()
    stop('c1')
    expect(useChatStore.getState().chats.c1!.working?.verbs).toEqual(['중지하는 중'])
    nextMockStep()
    expect(useChatStore.getState().chats.c1!.working).toBeNull()
    expect(useChatStore.getState().chats.c1!.items.at(-1)).toMatchObject({ type: 'notice', notice: { kind: 'stopped' } })
  })

  it('ends at once when no hold was asked for', () => {
    prime()
    stop('c1')
    expect(useChatStore.getState().chats.c1!.working).toBeNull()
  })
})
