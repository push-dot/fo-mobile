import { type StreamEvent } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  conversations: { stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn() },
  me: { updateSettings: vi.fn() },
}))
const upload = vi.hoisted(() => vi.fn())
vi.mock('@/shared/infrastructure', () => ({
  api,
  http: {},
  API_MOCK: false,
  hapticImpactLight: vi.fn(),
  hapticNotify: vi.fn(),
}))
vi.mock('@/features/my', () => ({ myApi: { upload, sources: vi.fn(), googleConnected: vi.fn() } }))

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
  api.conversations.stream.mockImplementation(() => frames({ type: 'token', text: '네' }, { type: 'done', operation: null }))
  api.conversations.follow.mockImplementation(() => frames())
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
    expect(api.conversations.stream).toHaveBeenCalledWith(
      'c-up',
      { text: '이 파일 봐 줘', accessMode: 'AUTO', context: { evidenceIds: [sourceId] } },
      expect.anything(),
    )
    expect(api.conversations.stream.mock.calls[0]?.[1]).not.toHaveProperty('attachment')
  })

  it('keeps documentId when the file upload adds evidenceIds', async () => {
    upload.mockResolvedValue({ id: sourceId })
    send('c-doc', '공고에 맞춰 줘', file, 'match_posting', { documentId: 'doc-1' })
    await vi.waitFor(() => expect(chat('c-doc').working).toBeNull())
    expect(api.conversations.stream).toHaveBeenCalledWith(
      'c-doc',
      {
        text: '공고에 맞춰 줘',
        accessMode: 'AUTO',
        intent: 'match_posting',
        context: { documentId: 'doc-1', evidenceIds: [sourceId] },
      },
      expect.anything(),
    )
  })

  it('does not stream when the upload fails', async () => {
    upload.mockRejectedValue(new Error('offline'))
    send('c-fail', '이 파일 봐 줘', file)
    await vi.waitFor(() => expect(chat('c-fail').items.at(-1)).toMatchObject({ type: 'error', text: '파일을 올리지 못했어요. 네트워크를 확인하고 다시 올려 주세요.' }))
    expect(api.conversations.stream).not.toHaveBeenCalled()
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
    await vi.waitFor(() => expect(api.conversations.stream).toHaveBeenCalledTimes(2))
    expect(upload).toHaveBeenCalledWith(queued)
    expect(api.conversations.stream).toHaveBeenLastCalledWith(
      'c-q',
      { text: '이어서', accessMode: 'AUTO', context: { evidenceIds: [sourceId] } },
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
    expect(api.conversations.stream).toHaveBeenCalledTimes(1)
    expect(api.conversations.stream.mock.calls[0]?.[1]).toMatchObject({ text: '먼저' })
    expect(chat('c-q-fail').working).toBeNull()
  })

  it('streams an existing source id without uploading again', async () => {
    send('c-src', '이 서류를 고쳐 줘', undefined, undefined, { evidenceIds: [sourceId] })
    await vi.waitFor(() => expect(chat('c-src').working).toBeNull())
    expect(upload).not.toHaveBeenCalled()
    expect(api.conversations.stream).toHaveBeenCalledWith(
      'c-src',
      { text: '이 서류를 고쳐 줘', accessMode: 'AUTO', context: { evidenceIds: [sourceId] } },
      expect.anything(),
    )
  })

  it('does not upload or attach a name-only chip to the stream body', async () => {
    send('c-name', '안녕', 'note.pdf')
    await vi.waitFor(() => expect(chat('c-name').working).toBeNull())
    expect(upload).not.toHaveBeenCalled()
    expect(api.conversations.stream).toHaveBeenCalledWith('c-name', { text: '안녕', accessMode: 'AUTO' }, expect.anything())
  })
})
