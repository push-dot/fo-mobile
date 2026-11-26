import type { BotContract } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  conversations: { stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn(), messages: vi.fn(), turns: vi.fn() },
  me: { updateSettings: vi.fn() },
}))
const upload = vi.hoisted(() => vi.fn())
const botApi = vi.hoisted(() => ({
  bots: { cancel: vi.fn(), send: vi.fn(), follow: vi.fn(), get: vi.fn(), transcript: vi.fn(), answer: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({
  api,
  botApi,
  http: {},
  API_MOCK: false,
  hapticImpactLight: vi.fn(),
  hapticNotify: vi.fn(),
}))
vi.mock('@/shared/infrastructure/sources', () => ({ sourcesApi: { upload, list: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: {},
}))

const { send, useChatStore } = await import('../stores')

async function* cut(...evs: BotContract.StreamEvent[]) {
  yield* evs
  throw new TypeError('Network request failed')
}

const chat = (id: string) => useChatStore.getState().chats[id]!

beforeEach(() => {
  vi.clearAllMocks()
  useChatStore.setState({ chats: {} })
})

describe('a dropped bot stream', () => {
  it('keeps the rest of the answer in the same bubble after it reconnects', async () => {
    const turn = 'job-1'
    const at = '2026-11-25T21:26:38Z'
    botApi.bots.send.mockImplementation(() => cut(
      { type: 'token', text: '변경 후: 백엔드 개발자\n\n참', seq: 36, at, turn },
    ))
    botApi.bots.follow.mockImplementation(async function* () {
      yield { type: 'token', text: '고로 직군은 그대로 둬요.', seq: 37, at, turn }
      yield { type: 'done', operation: null, seq: 38, at, turn }
    })
    send('c-drop', '직무를 백엔드로 바꿔 줘')
    await vi.waitFor(() => expect(chat('c-drop').working).toBeNull())
    const texts = chat('c-drop').items.flatMap((item) => (item.type === 'agentText' ? [item.text] : []))
    expect(texts).toEqual(['변경 후: 백엔드 개발자\n\n참고로 직군은 그대로 둬요.'])
    expect(botApi.bots.follow).toHaveBeenCalledWith('c-drop', 36, expect.anything())
  })
})
