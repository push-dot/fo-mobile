import { beforeEach, describe, expect, it, vi } from 'vitest'

const upload = vi.hoisted(() => vi.fn())
const post = vi.hoisted(() => vi.fn())
vi.mock('@/shared/infrastructure', () => ({
  api: { conversations: { stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn() }, me: { updateSettings: vi.fn() } },
  http: { post },
  API_MOCK: true,
  hapticImpactLight: vi.fn(),
  hapticNotify: vi.fn(),
}))
vi.mock('@/features/my', () => ({ myApi: { upload, sources: vi.fn(), googleConnected: vi.fn() } }))

const { send, useChatStore, usePrefs } = await import('../stores')

const file = { uri: 'file:///resume.pdf', name: 'resume.pdf', mimeType: 'application/pdf', size: 1200 }
const chat = (id: string) => useChatStore.getState().chats[id]!

beforeEach(() => {
  vi.clearAllMocks()
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
})
