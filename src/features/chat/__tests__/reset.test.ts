import { describe, expect, it, vi } from 'vitest'
import { emptyChat } from '../utils/reducer'

const botApi = vi.hoisted(() => ({ bots: { cancel: vi.fn(), send: vi.fn(), follow: vi.fn(), get: vi.fn(), transcript: vi.fn(), answer: vi.fn(), clearChat: vi.fn() } }))
vi.mock('@/shared/infrastructure', () => ({ api: {}, botApi, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/shared/infrastructure/sources', () => ({ sourcesApi: { upload: vi.fn() } }))
vi.mock('../api/fetchers', () => ({ chatApi: {} }))
vi.mock('@/shared/components/toast-store', () => ({ showToast: vi.fn() }))

const { clearPushChat, send, useChatStore, useDraftStore, setDraftText, useConsentPrompt } = await import('../stores')
const { runSessionCleared } = await import('@/shared/utility/session-reset')

describe('session cleared', () => {
  it('aborts the running stream and forgets chats, drafts and the consent prompt', async () => {
    let signal: AbortSignal | undefined
    botApi.bots.send.mockImplementation((_id: string, _body: unknown, s: AbortSignal) => {
      signal = s
      return (async function* () {
        await new Promise(() => undefined)
      })()
    })
    useChatStore.setState({ chats: { c1: { ...emptyChat } } })
    setDraftText('c1', '쓰던 글')
    useConsentPrompt.setState({ open: true })
    send('c1', '안녕')
    await vi.waitFor(() => expect(signal).toBeDefined())

    runSessionCleared()

    expect(signal?.aborted).toBe(true)
    expect(useChatStore.getState().chats).toEqual({})
    expect(useDraftStore.getState().byBot).toEqual({})
    expect(useConsentPrompt.getState()).toEqual({ open: false })
  })
})

describe('clear chat', () => {
  it('drops frames that arrive after the chat was cleared', async () => {
    let release: (() => void) | undefined
    botApi.bots.send.mockImplementation(() =>
      (async function* () {
        await new Promise<void>((resolve) => {
          release = resolve
        })
        yield { type: 'token', text: '늦은 답', seq: 1 }
        yield { type: 'status', text: '읽는 중', seq: 2 }
      })(),
    )
    botApi.bots.clearChat.mockResolvedValue(undefined)
    send('c2', '안녕')
    await vi.waitFor(() => expect(release).toBeDefined())

    await clearPushChat('c2', 'push')
    release?.()
    await new Promise((resolve) => setTimeout(resolve, 40))

    expect(useChatStore.getState().chats.c2).toEqual(emptyChat)
  })
})
