import { ApiError, type StreamEvent } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  conversations: { stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn() },
  me: { updateSettings: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({
  api,
  http: {},
  API_MOCK: false,
  hapticImpactLight: vi.fn(),
  hapticNotify: vi.fn(),
}))
vi.mock('@/features/my', () => ({ myApi: { sources: vi.fn(), googleConnected: vi.fn() } }))

const { answer, pickAccessMode, send, useChatStore, usePrefs } = await import('../store')
const { emptyChat } = await import('../reducer')

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}
const chat = (id: string) => useChatStore.getState().chats[id]!
const settled = (id: string) => vi.waitFor(() => expect(chat(id).working).toBeNull())
const pending = (id: string, optionIds?: string[]) =>
  useChatStore.setState({
    chats: {
      [id]: {
        ...emptyChat,
        approval: { id: 'ap1', question: '메일을 보낼까요?', optionIds, sections: [{ kind: 'choices', items: [{ label: '실행' }, { label: '취소' }], selected: [] }] },
      },
    },
  })

beforeEach(() => {
  vi.clearAllMocks()
  usePrefs.setState({ accessMode: 'AUTO' })
  api.conversations.stream.mockImplementation(() => frames({ type: 'token', text: '네' }, { type: 'done', operation: null }))
  api.conversations.follow.mockImplementation(() => frames({ type: 'tool', name: 'send_mail', state: 'ok', summary: '메일 보내기' }, { type: 'done', operation: null }))
})

describe('access mode', () => {
  it('defaults to AUTO and sends the current mode with every stream', async () => {
    send('c1', '안녕')
    await settled('c1')
    expect(api.conversations.stream).toHaveBeenLastCalledWith('c1', { text: '안녕', accessMode: 'AUTO' }, expect.anything())
    usePrefs.setState({ accessMode: 'BYPASS' })
    send('c1', '또')
    await settled('c1')
    expect(api.conversations.stream).toHaveBeenLastCalledWith('c1', { text: '또', accessMode: 'BYPASS' }, expect.anything())
  })

  it('picking a mode updates local state first and saves it', async () => {
    api.me.updateSettings.mockResolvedValue({ aiAccessMode: 'ALWAYS_ASK' })
    const saving = pickAccessMode('ALWAYS_ASK')
    expect(usePrefs.getState().accessMode).toBe('ALWAYS_ASK')
    await saving
    expect(api.me.updateSettings).toHaveBeenCalledWith({ aiAccessMode: 'ALWAYS_ASK' })
  })

  it('rolls the mode back when saving fails', async () => {
    api.me.updateSettings.mockRejectedValue(new Error('offline'))
    await expect(pickAccessMode('BYPASS')).rejects.toThrow()
    expect(usePrefs.getState().accessMode).toBe('AUTO')
  })
})

describe('server approvals', () => {
  it('answer resolves with the option id, then follows the resume job', async () => {
    api.conversations.resolveApproval.mockResolvedValue({ id: 'ap1', status: 'APPROVED', optionId: 'approve', jobId: 'j1' })
    pending('c2', ['approve', 'reject'])
    answer('c2', '실행', 0)
    await settled('c2')
    expect(api.conversations.resolveApproval).toHaveBeenCalledWith('c2', 'ap1', 'approve')
    expect(api.conversations.follow).toHaveBeenCalledWith('c2', undefined, expect.anything())
    expect(api.conversations.stream).not.toHaveBeenCalled()
    expect(chat('c2').approval).toBeNull()
    expect(chat('c2').items).toMatchObject([{ type: 'user', text: '실행' }, { type: 'tool', state: 'ok' }, { type: 'worked' }])
  })

  it('shows an error line when the approval already expired', async () => {
    api.conversations.resolveApproval.mockRejectedValue(new ApiError('gone', 'APPROVAL_EXPIRED', 410))
    pending('c3', ['approve', 'reject'])
    answer('c3', '취소', 1)
    await vi.waitFor(() => expect(chat('c3').items.at(-1)).toMatchObject({ type: 'error' }))
    expect(chat('c3').approval).toBeNull()
    expect(api.conversations.follow).not.toHaveBeenCalled()
  })

  it('free text while an approval waits goes out as a normal message', async () => {
    pending('c4', ['approve', 'reject'])
    send('c4', '제목만 바꿔 줘')
    await settled('c4')
    expect(api.conversations.resolveApproval).not.toHaveBeenCalled()
    expect(api.conversations.stream).toHaveBeenCalledWith('c4', { text: '제목만 바꿔 줘', accessMode: 'AUTO' }, expect.anything())
    expect(chat('c4').approval).toBeNull()
  })
})
