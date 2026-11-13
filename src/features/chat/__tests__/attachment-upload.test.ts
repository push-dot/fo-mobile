import { type StreamEvent } from '@push/api-client'
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
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { upload, sources: vi.fn(), googleConnected: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: {},
  fetchConversationMessages: (id: string) => api.conversations.messages(id, { limit: 50 }),
  fetchConversationTurns: (id: string) => api.conversations.turns(id, { limit: 50 }),
  followConversation: (...args: [string, unknown, AbortSignal]) => api.conversations.follow(...args),
  resolveConversationApproval: (...args: unknown[]) => api.conversations.resolveApproval(...(args as [string, string, string])),
  streamConversation: (...args: unknown[]) => api.conversations.stream(...(args as [string, object, AbortSignal])),
  updateAiAccessMode: (mode: unknown) => api.me.updateSettings({ aiAccessMode: mode }),
}))

const { send, useChatStore, usePrefs } = await import('../stores')

const file = { uri: 'file:///resume.pdf', name: 'resume.pdf', mimeType: 'application/pdf', size: 1200 }
const sourceId = '11111111-1111-4111-8111-111111111111'

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}
const chat = (id: string) => useChatStore.getState().chats[id]!

beforeEach(() => {
  vi.clearAllMocks()
  useChatStore.setState({ chats: {} })
  usePrefs.setState({ accessMode: 'AUTO' })
  botApi.bots.send.mockImplementation(() => frames({ type: 'token', text: '네' }, { type: 'done', operation: null }))
  botApi.bots.follow.mockImplementation(() => frames())
})

describe('chat attachment upload', () => {
  it('uploads the file, shows sending, then streams context.evidenceIds', async () => {
    let sending = false
    upload.mockImplementation(async () => {
      sending = chat('c-up').working != null
      return { id: sourceId }
    })
    send('c-up', '이 파일 봐 줘', file)
    await vi.waitFor(() => expect(chat('c-up').working).toBeNull())
    expect(sending).toBe(true)
    expect(upload).toHaveBeenCalledWith(file)
    expect(botApi.bots.send).toHaveBeenCalledWith(
      'c-up',
      { text: '이 파일 봐 줘', accessMode: 'AUTO', attachments: [{ kind: 'file', id: sourceId }] },
      expect.anything(),
    )
    expect(botApi.bots.send.mock.calls[0]?.[1]).not.toHaveProperty('attachment')
  })

  it('keeps documentId when the file upload adds evidenceIds', async () => {
    upload.mockResolvedValue({ id: sourceId })
    send('c-doc', '공고에 맞춰 줘', file, 'match_posting', { documentId: 'doc-1' })
    await vi.waitFor(() => expect(chat('c-doc').working).toBeNull())
    expect(botApi.bots.send).toHaveBeenCalledWith(
      'c-doc',
      {
        text: '공고에 맞춰 줘',
        accessMode: 'AUTO',
        intent: 'match_posting',
        attachments: [
          { kind: 'document', id: 'doc-1' },
          { kind: 'file', id: sourceId },
        ],
      },
      expect.anything(),
    )
  })

  it('does not stream when the upload fails', async () => {
    upload.mockRejectedValue(new Error('offline'))
    send('c-fail', '이 파일 봐 줘', file)
    await vi.waitFor(() => expect(chat('c-fail').items.at(-1)).toMatchObject({ type: 'error', text: '파일을 올리지 못했어요. 네트워크를 확인하고 다시 올려 주세요.' }))
    expect(botApi.bots.send).not.toHaveBeenCalled()
    expect(chat('c-fail').working).toBeNull()
  })

  it('uploads a file queued while the agent is working', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const first = { uri: 'file:///first.pdf', name: 'first.pdf', mimeType: 'application/pdf', size: 10 }
    const queued = { uri: 'file:///queued.pdf', name: 'queued.pdf', mimeType: 'application/pdf', size: 20 }
    upload.mockImplementation(async (picked: { name: string }) => {
      if (picked.name === 'first.pdf') await gate
      return { id: picked.name === 'first.pdf' ? 'src-first' : sourceId }
    })
    send('c-q', '먼저', first)
    await vi.waitFor(() => expect(chat('c-q').working).not.toBeNull())
    send('c-q', '이어서', queued)
    expect(upload).toHaveBeenCalledTimes(1)
    expect(chat('c-q').queue).toEqual([{ text: '이어서', file: queued }])
    release()
    await vi.waitFor(() => expect(botApi.bots.send).toHaveBeenCalledTimes(2))
    expect(upload).toHaveBeenCalledWith(queued)
    expect(botApi.bots.send).toHaveBeenLastCalledWith(
      'c-q',
      { text: '이어서', accessMode: 'AUTO', attachments: [{ kind: 'file', id: sourceId }] },
      expect.anything(),
    )
  })

  it('does not stream a queued file when its upload fails', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const first = { uri: 'file:///first.pdf', name: 'first.pdf', mimeType: 'application/pdf', size: 10 }
    const queued = { uri: 'file:///queued.pdf', name: 'queued.pdf', mimeType: 'application/pdf', size: 20 }
    upload.mockImplementation(async (picked: { name: string }) => {
      if (picked.name === 'first.pdf') {
        await gate
        return { id: 'src-first' }
      }
      throw new Error('offline')
    })
    send('c-q-fail', '먼저', first)
    await vi.waitFor(() => expect(chat('c-q-fail').working).not.toBeNull())
    send('c-q-fail', '이어서', queued)
    release()
    await vi.waitFor(() => expect(chat('c-q-fail').items.some((item) => item.type === 'error')).toBe(true))
    expect(botApi.bots.send).toHaveBeenCalledTimes(1)
    expect(botApi.bots.send.mock.calls[0]?.[1]).toMatchObject({ text: '먼저' })
    expect(chat('c-q-fail').working).toBeNull()
  })

  it('streams an existing source id without uploading again', async () => {
    send('c-src', '이 서류를 고쳐 줘', undefined, undefined, { evidenceIds: [sourceId] })
    await vi.waitFor(() => expect(chat('c-src').working).toBeNull())
    expect(upload).not.toHaveBeenCalled()
    expect(botApi.bots.send).toHaveBeenCalledWith(
      'c-src',
      { text: '이 서류를 고쳐 줘', accessMode: 'AUTO', attachments: [{ kind: 'file', id: sourceId }] },
      expect.anything(),
    )
  })

  it('does not upload or attach a name-only chip to the stream body', async () => {
    send('c-name', '안녕', 'note.pdf')
    await vi.waitFor(() => expect(chat('c-name').working).toBeNull())
    expect(upload).not.toHaveBeenCalled()
    expect(botApi.bots.send).toHaveBeenCalledWith('c-name', { text: '안녕', accessMode: 'AUTO' }, expect.anything())
  })
})
