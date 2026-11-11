import { type ConversationTurn, type StreamEvent } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  conversations: { stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn(), messages: vi.fn(), turns: vi.fn() },
  me: { updateSettings: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({ api, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { upload: vi.fn(), sources: vi.fn(), googleConnected: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: {},
  fetchConversationMessages: (id: string) => api.conversations.messages(id, { limit: 50 }),
  fetchConversationTurns: (id: string) => api.conversations.turns(id, { limit: 50 }),
  followConversation: (...args: [string, unknown, AbortSignal]) => api.conversations.follow(...args),
  resolveConversationApproval: (...args: unknown[]) => api.conversations.resolveApproval(...(args as [string, string, string])),
  streamConversation: (...args: unknown[]) => api.conversations.stream(...(args as [string, object, AbortSignal])),
  updateAiAccessMode: (mode: unknown) => api.me.updateSettings({ aiAccessMode: mode }),
}))

const { hydrate, useChatStore } = await import('../stores')

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}
const chat = (id: string) => useChatStore.getState().chats[id]!
const page = <T,>(data: T[]) => ({ data, page: { nextCursor: null } })
const turn = (jobId: string, status: ConversationTurn['status'], events: ConversationTurn['events'], userMessageId: string | null): ConversationTurn => ({
  jobId, status, createdAt: '2026-11-05T00:00:00Z', userMessageId, assistantMessageId: null, answer: null, events,
})
const message = (id: string, text: string) => ({ id, conversationId: 'c', role: 'USER' as const, text, attachments: [], operationId: null, createdAt: '' })

beforeEach(() => {
  vi.clearAllMocks()
  useChatStore.setState({ chats: {} })
  api.conversations.follow.mockImplementation(() => frames())
})

describe('hydrate', () => {
  it('restores the cards of finished turns and replays the running job from its start', async () => {
    api.conversations.messages.mockResolvedValue(page([message('m1', '맞춰 줘'), message('m2', '이어서 해 줘')]))
    api.conversations.turns.mockResolvedValue(
      page([
        turn('j2', 'RUNNING', [{ type: 'token', text: '보는 중', seq: 9 }], 'm2'),
        turn('j1', 'DONE', [{ type: 'tool', name: 'read_resume', state: 'ok', summary: '이력서 읽기', resultLine: '2쪽', seq: 2 }], 'm1'),
      ]),
    )
    api.conversations.follow.mockImplementation(() => frames({ type: 'token', text: '보는 중', seq: 9 }, { type: 'done', operation: null, seq: 10 }))
    await hydrate('c1')
    await vi.waitFor(() => expect(chat('c1').working).toBeNull())
    expect(api.conversations.follow).toHaveBeenCalledWith('c1', undefined, expect.anything())
    expect(chat('c1').items.map((i) => (i.type === 'user' || i.type === 'agentText' ? i.text : i.type))).toEqual(['맞춰 줘', 'tool', '이어서 해 줘', '보는 중', 'worked'])
  })

  it('falls back to the plain messages when the turns cannot be read', async () => {
    api.conversations.messages.mockResolvedValue(page([message('m1', '안녕')]))
    api.conversations.turns.mockRejectedValue(new Error('404'))
    await hydrate('c2')
    expect(chat('c2').items).toMatchObject([{ type: 'user', text: '안녕' }])
    expect(api.conversations.follow).not.toHaveBeenCalled()
  })
})
