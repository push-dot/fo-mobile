import { type DataEnvelope, type ListEnvelope } from '@push/api-client'
import { api, http, API_BASE_URL, API_MOCK } from '@/shared/infrastructure'
import { sourcesApi, type PickedFile } from '@/shared/infrastructure/sources'
import { DEFAULT_DOC } from '../constants'
import { accountFromBilling } from '../utils/account'
import { chatDocFromSource } from '../utils/docs'
import { QS_NEEDS, quickStartFrom, type QsSources } from '../utils/quick-start-data'
import type { Step } from '../types'
import type { Account, ChatDoc, ConversationRow, QsData, RunInput } from './schemas'

const c = http

const data = async <T>(p: Promise<DataEnvelope<T>>) => (await p).data

const realDocs = async (): Promise<ChatDoc[]> => (await sourcesApi.list()).data.map(chatDocFromSource)

const load: { [K in keyof QsSources]-?: () => Promise<QsSources[K]> } = {
  bookmarks: async () => (await api.me.bookmarks({ limit: 50 })).data,
  applications: async () => (await api.applications.list({ limit: 50 })).data,
  offers: async () => (await api.me.offers('received', { limit: 50 })).data,
  follows: async () => (await api.me.follows({ limit: 50 })).data,
  recent: async () => (await api.me.postingViews({ limit: 50 })).data,
  recommended: async () => (await api.profiles.list({ explore: 'recommended', limit: 50 })).data,
  profile: () => api.me.profile(),
  doc: async () => DEFAULT_DOC,
}

export const chatApi = {
  conversations: (q: { limit?: number; archived?: 'true' } = {}) => c.get<ListEnvelope<ConversationRow>>('conversations', { query: q }),
  conversation: (id: string) => data(c.get<DataEnvelope<ConversationRow>>(`conversations/${id}`)),
  run: (body: RunInput) => data(c.post<DataEnvelope<Step[]>>('chat/runs', { body })),
  hubProfileId: async () => (await api.documents.list({ kind: 'HUB_PROFILE', limit: 1 })).data[0]?.id,
  docs: () => (API_MOCK ? data(c.get<DataEnvelope<ChatDoc[]>>('chat/docs')) : realDocs()),
  addDoc: async (file: PickedFile) => {
    if (API_MOCK) return data(c.post<DataEnvelope<ChatDoc>>('chat/docs', { body: { fileName: file.name, size: file.size ?? 0 } }))
    await sourcesApi.upload(file)
  },
  account: async (): Promise<Account> => {
    if (API_MOCK) return data(c.get<DataEnvelope<Account>>('chat/account'))
    const [b, me] = await Promise.all([api.billing.status(), api.auth.me()])
    return accountFromBilling(b, me.email)
  },
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

export const pinConversation = (id: string, expectedRevision: number, pinned: boolean) =>
  c.patch<DataEnvelope<ConversationRow>>(`conversations/${id}`, { body: { expectedRevision, pinned } })

export const unarchiveConversation = (id: string, expectedRevision: number) =>
  c.post<DataEnvelope<ConversationRow>>(`conversations/${id}/unarchive`, { body: { expectedRevision } })

export const deleteConversation = (id: string) => c.delete<void>(`conversations/${id}`)

export const fetchMyProfile = api.me.profile

export const fetchMentionBookmarks = () => api.me.bookmarks({ limit: 20 })

const bytesOf = async (res: Promise<Response>) => new Uint8Array(await (await res).arrayBuffer())

const artifactResponse = async (downloadUrl: string): Promise<Response> => {
  const base = new URL(API_BASE_URL)
  const basePath = base.pathname.replace(/\/+$/, '')
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(downloadUrl) ? downloadUrl : downloadUrl.replace(/^\/+/, ''), `${base.origin}${basePath}/`)
  if (url.origin === base.origin && url.pathname.startsWith(`${basePath}/`)) {
    return c.raw('GET', url.pathname.slice(basePath.length), { query: Object.fromEntries(url.searchParams) })
  }
  if (url.protocol !== 'https:') throw new Error('unsupported download url')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed: ${res.status}`)
  return res
}

export const fetchArtifactBytes = (downloadUrl: string) => bytesOf(artifactResponse(downloadUrl))

export const fetchSourceBytes = (id: string) => bytesOf(api.sources.content(id))

export const fetchProfilePdf = (photo = false) => bytesOf(api.me.profilePdf(photo))

export const fetchDocumentPdf = async (id: string) => {
  if (!id) throw new Error('no document to export')
  const doc = await api.documents.get(id)
  const version = doc.finalizedVersionId ?? doc.latestVersionId
  if (!version) throw new Error(`document ${id} has no version`)
  return { title: doc.title, bytes: await bytesOf(api.documents.exportFile(id, version)) }
}

export const streamConversation = api.conversations.stream

export const followConversation = api.conversations.follow

export const resolveConversationApproval = api.conversations.resolveApproval

export const fetchConversationMessages = (id: string) => api.conversations.messages(id, { limit: 50 })

export const fetchConversationTurns = (id: string) => api.conversations.turns(id, { limit: 50 })
