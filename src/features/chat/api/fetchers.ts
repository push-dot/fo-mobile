import { type AccessMode, type DataEnvelope, type ListEnvelope } from '@push/api-client'
import { api, http, API_MOCK } from '@/shared/infrastructure'
import { myApi, type PickedFile } from '@/features/my'
import { MICRO_CREDITS_PER_CREDIT } from '../constants'
import { QS_NEEDS, quickStartFrom, type QsSources } from '../utils/quick-start-data'
import type { Step } from '../types'
import type { Account, ChatDoc, ConversationRow, QsData, RunInput } from './schemas'

// shortcut: endpoints @push/api-client lacks go through the shared client directly; move them into
// @push/api-client once push-be ships them.
const c = http

const data = async <T>(p: Promise<DataEnvelope<T>>) => (await p).data

/** 내 서류 for chat: the same list as 마이 › 서류. */
const realDocs = async (): Promise<ChatDoc[]> =>
  (await myApi.sources()).data.map((s) => ({ id: s.id, fileName: s.fileName, size: s.size, createdAt: s.createdAt ?? new Date().toISOString() }))

const load: { [K in keyof QsSources]-?: () => Promise<QsSources[K]> } = {
  bookmarks: async () => (await api.me.bookmarks({ limit: 50 })).data,
  applications: async () => (await api.applications.list({ limit: 50 })).data,
  offers: async () => (await api.me.offers('received', { limit: 50 })).data,
  follows: async () => (await api.me.follows({ limit: 50 })).data,
  doc: async () => (await realDocs())[0]?.fileName,
  connected: () => myApi.googleConnected(),
}

export const chatApi = {
  conversations: (q: { limit?: number } = {}) => c.get<ListEnvelope<ConversationRow>>('conversations', { query: q }),
  /** Mock-only: the scripted agent run for one message or approval answer. */
  run: (body: RunInput) => data(c.post<DataEnvelope<Step[]>>('chat/runs', { body })),
  // shortcut: push-be has no chat/docs; real mode reads 마이 › 서류 (myApi.sources) and uploads there.
  docs: () => (API_MOCK ? data(c.get<DataEnvelope<ChatDoc[]>>('chat/docs')) : realDocs()),
  addDoc: async (file: PickedFile) => {
    if (API_MOCK) return data(c.post<DataEnvelope<ChatDoc>>('chat/docs', { body: { fileName: file.name, size: file.size ?? 0 } }))
    await myApi.upload(file)
  },
  checkout: (planId: 'PRO' | 'ULTRA') => api.billing.checkout(planId),
  account: async (): Promise<Account> => {
    if (API_MOCK) return data(c.get<DataEnvelope<Account>>('chat/account'))
    const [b, me] = await Promise.all([api.billing.status(), api.auth.me()])
    const total = Math.round(b.monthlyMicroCredits / MICRO_CREDITS_PER_CREDIT)
    const used = Math.round(b.spentMicroCredits / MICRO_CREDITS_PER_CREDIT)
    return { email: me.email || null, plan: b.plan ?? 'FREE', credits: total > 0 ? { used, total } : null }
  },
  // shortcut: push-be has no chat/quick-starts; real mode assembles each sheet from existing lists (quickStartFrom).
  quickStart: async (key: string): Promise<QsData> => {
    if (API_MOCK) return data(c.get<DataEnvelope<QsData>>(`chat/quick-starts/${key}`))
    const needs = QS_NEEDS[key] ?? []
    const got = await Promise.all(needs.map((k) => load[k]().catch(() => undefined)))
    return quickStartFrom(key, Object.fromEntries(needs.map((k, i) => [k, got[i]])))
  },
}

export const createConversation = api.conversations.create

export const renameConversation = api.conversations.rename

export const archiveConversation = api.conversations.archive

export const fetchMyProfile = api.me.profile

export const fetchMentionBookmarks = () => api.me.bookmarks({ limit: 20 })

export const fetchArtifactBytes = async (downloadUrl: string) =>
  new Uint8Array(await (await c.raw('GET', downloadUrl)).arrayBuffer())

export const updateAiAccessMode = (mode: AccessMode) => api.me.updateSettings({ aiAccessMode: mode })

export const streamConversation = api.conversations.stream

export const followConversation = api.conversations.follow

export const resolveConversationApproval = api.conversations.resolveApproval

export const fetchConversationMessages = (id: string) => api.conversations.messages(id, { limit: 50 })
