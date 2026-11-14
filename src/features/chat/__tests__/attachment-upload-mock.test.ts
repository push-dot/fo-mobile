import { beforeEach, describe, expect, it, vi } from 'vitest'

const upload = vi.hoisted(() => vi.fn())
const post = vi.hoisted(() => vi.fn())
const failing = vi.hoisted(() => ({ on: false }))
vi.mock('@/shared/infrastructure', () => ({
  api: { conversations: { stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn() }, me: { updateSettings: vi.fn() } },
  http: { post },
  API_MOCK: true,
  mockUploadFailing: () => failing.on,
  hapticImpactLight: vi.fn(),
  hapticNotify: vi.fn(),
}))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { upload, sources: vi.fn(), googleConnected: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: {
    run: async (body: unknown) => {
      const r = await post('chat/runs', { body })
      return r.data
    },
  },
  fetchConversationMessages: () => Promise.resolve({ data: [] }),
  fetchConversationTurns: () => Promise.resolve({ data: [] }),
  followConversation: () => (async function* () {})(),
  resolveConversationApproval: vi.fn(),
  streamConversation: () => (async function* () {})(),
  updateAiAccessMode: vi.fn(),
}))

const { send, useChatStore, usePrefs } = await import('../stores')

const file = { uri: 'file:///resume.pdf', name: 'resume.pdf', mimeType: 'application/pdf', size: 1200 }
const chat = (id: string) => useChatStore.getState().chats[id]!

beforeEach(() => {
  vi.clearAllMocks()
  failing.on = false
  useChatStore.setState({ chats: {} })
  usePrefs.setState({ accessMode: 'AUTO' })
  post.mockResolvedValue({ data: [{ wait: 0, event: { type: 'done', at: 0 } }] })
})

describe('chat attachment in mock mode', () => {
  it('runs the script with the file name and does not upload', async () => {
    send('c-mock', '이 파일로 맞춰 주세요', file)
    await vi.waitFor(() => expect(chat('c-mock').working).toBeNull())
    expect(upload).not.toHaveBeenCalled()
    expect(post).toHaveBeenCalledWith('chat/runs', {
      body: expect.objectContaining({ text: '이 파일로 맞춰 주세요', attachment: 'resume.pdf' }),
    })
    expect(post.mock.calls[0]?.[1].body).not.toHaveProperty('file')
  })

  // mock=upload-fail (ChatErrUpload): the mock API skips uploads, so the switch makes the send fail the way a dropped connection does.
  it('draws the upload error and starts no run when mock uploads fail', async () => {
    failing.on = true
    send('c-fail', '이 파일로 맞춰 주세요', file)
    await vi.waitFor(() => expect(chat('c-fail').working).toBeNull())
    expect(post).not.toHaveBeenCalled()
    expect(chat('c-fail').items.at(-1)).toMatchObject({ type: 'error', text: '파일을 올리지 못했어요. 네트워크를 확인하고 다시 올려 주세요.' })
  })
})
