import { describe, expect, it, vi } from 'vitest'
import { emptyChat } from '../utils/reducer'

const botApi = vi.hoisted(() => ({ bots: { cancel: vi.fn(), send: vi.fn(), follow: vi.fn(), get: vi.fn(), transcript: vi.fn(), answer: vi.fn() } }))
vi.mock('@/shared/infrastructure', () => ({ api: {}, botApi, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { upload: vi.fn() } }))
vi.mock('../api/fetchers', () => ({ chatApi: {} }))
vi.mock('@/shared/components/toast-store', () => ({ showToast: vi.fn() }))

const { send, useChatStore, useDraftStore, setDraftText, useConsentPrompt } = await import('../stores')
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
    useConsentPrompt.setState({ open: true, dismissed: true })
    send('c1', '안녕')
    await vi.waitFor(() => expect(signal).toBeDefined())

    runSessionCleared()

    expect(signal?.aborted).toBe(true)
    expect(useChatStore.getState().chats).toEqual({})
    expect(useDraftStore.getState().byBot).toEqual({})
    expect(useConsentPrompt.getState()).toEqual({ open: false, dismissed: false })
  })
})
