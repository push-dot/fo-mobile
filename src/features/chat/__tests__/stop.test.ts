import { ApiError } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAT_STOP_FAILED, CHAT_STOP_FORBIDDEN } from '../constants'
import { emptyChat } from '../utils/reducer'

const showToast = vi.hoisted(() => vi.fn())
const api = vi.hoisted(() => ({
  conversations: { stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn(), messages: vi.fn(), turns: vi.fn(), cancel: vi.fn() },
  me: { updateSettings: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({ api, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my', () => ({ myApi: { upload: vi.fn(), sources: vi.fn(), googleConnected: vi.fn() } }))
vi.mock('@/shared/components/toast-store', () => ({ showToast }))

const { stop, useChatStore } = await import('../stores')

const prime = () =>
  useChatStore.setState({
    chats: { c1: { ...emptyChat, working: { verbs: ['생각하는 중…'], startedAt: 1 }, runStartedAt: 1 } },
  })

const settled = async () => {
  const result = api.conversations.cancel.mock.results.at(-1)?.value
  if (result && typeof result.then === 'function') await result.catch(() => undefined)
}

beforeEach(() => {
  vi.clearAllMocks()
  useChatStore.setState({ chats: {} })
  api.conversations.cancel.mockResolvedValue({ jobId: 'j1', status: 'CANCELLED' })
})

describe('stop', () => {
  it('cancels the server job once, then clears the local run', async () => {
    prime()
    stop('c1')
    expect(api.conversations.cancel).toHaveBeenCalledExactlyOnceWith('c1')
    expect(useChatStore.getState().chats.c1!.working).not.toBeNull()
    await settled()
    await Promise.resolve()
    expect(useChatStore.getState().chats.c1!.working).toBeNull()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('shows the other-member copy on 403 and keeps the stop control', async () => {
    prime()
    api.conversations.cancel.mockRejectedValueOnce(new ApiError('forbidden', 'FORBIDDEN', 403))
    stop('c1')
    await settled()
    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: CHAT_STOP_FORBIDDEN })
    expect(useChatStore.getState().chats.c1!.working).not.toBeNull()
  })

  it('stays quiet when the job already finished (409) and clears the local run', async () => {
    prime()
    api.conversations.cancel.mockRejectedValueOnce(new ApiError('finished', 'CONFLICT', 409))
    stop('c1')
    await settled()
    await Promise.resolve()
    expect(api.conversations.cancel).toHaveBeenCalledOnce()
    expect(showToast).not.toHaveBeenCalled()
    expect(useChatStore.getState().chats.c1!.working).toBeNull()
  })

  it('uses the stop-failed copy for any other error and keeps the stop control', async () => {
    prime()
    api.conversations.cancel.mockRejectedValueOnce(new Error('offline'))
    stop('c1')
    await settled()
    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: CHAT_STOP_FAILED })
    expect(useChatStore.getState().chats.c1!.working).not.toBeNull()
  })
})
