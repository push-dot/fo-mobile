import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/providers/query-client'
import { emptyChat } from '../utils/reducer'

const botApi = vi.hoisted(() => ({
  bots: {
    get: vi.fn(),
    transcript: vi.fn(),
    send: vi.fn(),
    follow: vi.fn(),
    cancel: vi.fn(),
    answer: vi.fn(),
    remove: vi.fn(),
    clearChat: vi.fn(),
  },
}))
const api = vi.hoisted(() => ({
  conversations: { cancel: vi.fn(), stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn(), messages: vi.fn(), turns: vi.fn() },
  me: { updateSettings: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({ api, botApi, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { upload: vi.fn(), sources: vi.fn(), googleConnected: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: { run: vi.fn() },
  fetchConversationMessages: vi.fn(),
  fetchConversationTurns: vi.fn(),
  followConversation: vi.fn(),
  resolveConversationApproval: vi.fn(),
  streamConversation: vi.fn(),
  updateAiAccessMode: (mode: unknown) => api.me.updateSettings({ aiAccessMode: mode }),
}))
vi.mock('@/shared/components/toast-store', () => ({ showToast: vi.fn() }))

const { appendDraftText, attach, attachDraftChip, attachDraftFile, clearDraft, clearPushChat, deleteCompanyBot, detachDraft, setDraftText, useChatStore, useDraftStore } = await import('../stores')

const file = { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 4 }
const user = { type: 'user' as const, id: 'u', text: '질문' }

beforeEach(() => {
  vi.clearAllMocks()
  useChatStore.setState({ chats: {} })
  useDraftStore.setState({ byBot: {} })
  botApi.bots.clearChat.mockResolvedValue(undefined)
  botApi.bots.remove.mockResolvedValue(undefined)
  vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
})

describe('draft per bot', () => {
  it('lands a material on the bot that opened the sheet', () => {
    appendDraftText('b1', '이력서.pdf')
    appendDraftText('b2', '다른 공고')
    appendDraftText('b1', '공고 링크')
    expect(useDraftStore.getState().byBot.b1?.text).toBe('이력서.pdf 공고 링크')
    expect(useDraftStore.getState().byBot.b2?.text).toBe('다른 공고')
    expect(useDraftStore.getState().byBot.local).toBeUndefined()
  })

  it('attaches a file, then detaches it without clearing the text', () => {
    setDraftText('b1', '같이 보낼 말')
    attachDraftFile('b1', file)
    expect(useDraftStore.getState().byBot.b1).toMatchObject({ text: '같이 보낼 말', file, chip: undefined })
    detachDraft('b1')
    expect(useDraftStore.getState().byBot.b1).toEqual({ text: '같이 보낼 말' })
  })

  it('puts a material chip on that bot only', () => {
    setDraftText('b2', '그대로')
    attach('b1' as never, { kind: 'document', id: 'd1', title: '김서준_백엔드_이력서.pdf' })
    expect(useDraftStore.getState().byBot.b1?.chip).toBe('김서준_백엔드_이력서.pdf')
    expect(useDraftStore.getState().byBot.b1?.file).toBeUndefined()
    expect(useDraftStore.getState().byBot.b2?.text).toBe('그대로')
    attachDraftChip('b1', '다른 자료')
    detachDraft('b1')
    expect(useDraftStore.getState().byBot.b1?.chip).toBeUndefined()
  })

  it('drops the draft after a send clears it', () => {
    setDraftText('local', '홈')
    clearDraft('local')
    expect(useDraftStore.getState().byBot.local).toBeUndefined()
  })
})

describe('header destructive actions', () => {
  beforeEach(() => {
    useChatStore.setState({ chats: { b1: { ...emptyChat, items: [user] } } })
    setDraftText('b1', '남길 말')
  })

  it('clears only a Push Bot chat, and only after the call succeeds', async () => {
    expect(await clearPushChat('b1', 'company')).toBe(false)
    expect(botApi.bots.clearChat).not.toHaveBeenCalled()
    expect(useChatStore.getState().chats.b1?.items).toHaveLength(1)

    botApi.bots.clearChat.mockRejectedValueOnce(new Error('no'))
    await expect(clearPushChat('b1', 'push')).rejects.toThrow('no')
    expect(useChatStore.getState().chats.b1?.items).toHaveLength(1)

    expect(await clearPushChat('b1', 'push')).toBe(true)
    expect(botApi.bots.clearChat).toHaveBeenCalledWith('b1')
    expect(useChatStore.getState().chats.b1).toEqual(emptyChat)
    expect(useDraftStore.getState().byBot.b1).toBeUndefined()
    expect(botApi.bots.remove).not.toHaveBeenCalled()
  })

  it('deletes only a company bot', async () => {
    expect(await deleteCompanyBot('b1', 'push')).toBe(false)
    expect(botApi.bots.remove).not.toHaveBeenCalled()

    botApi.bots.remove.mockRejectedValueOnce(new Error('no'))
    await expect(deleteCompanyBot('b1', 'company')).rejects.toThrow('no')
    expect(useChatStore.getState().chats.b1?.items).toHaveLength(1)

    expect(await deleteCompanyBot('b1', 'company')).toBe(true)
    expect(botApi.bots.remove).toHaveBeenCalledWith('b1')
    expect(useChatStore.getState().chats.b1).toBeUndefined()
    expect(useDraftStore.getState().byBot.b1).toBeUndefined()
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['bots'] })
    expect(botApi.bots.clearChat).not.toHaveBeenCalled()
  })
})
