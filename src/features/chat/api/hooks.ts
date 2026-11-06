import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ChatIntent, type ListEnvelope } from '@push/api-client'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { useMyLinks, useMySettings, type PickedFile } from '@/features/my'
import { pickDocument, shareBytes, useSession } from '../../../shared/infrastructure'
import { showToast } from '@/shared/components'
import { CHAT_DOC_OPTIONS, CHAT_DOCS_KEY, MENTION_SHORTCUT_KEYS, QUICK_STARTS, docAiSub, linkMentionSub } from '../constants'
import { ago } from '../utils/ago'
import { LINK_KIND_LABEL } from '../utils/links'
import { cacheName } from '../utils/cache-name'
import { exclusive, pdfName, shareErrorText } from '../utils/share'
import type { MentionGroup } from '../utils/mentions'
import { isConsentRequired } from '../utils/consent'
import { retryUnlessMissing } from '../utils/retry'
import { askConsent, bindOpenChat, forget, holdOpen, pickAccessMode, send, usePrefs } from '../stores'
import {
  archiveConversation,
  chatApi,
  createConversation,
  deleteConversation,
  fetchArtifactBytes,
  fetchDocumentPdf,
  fetchSourceBytes,
  fetchMentionBookmarks,
  fetchMyProfile,
  pinConversation,
  renameConversation,
  unarchiveConversation,
} from './fetchers'
import type { ConversationRow, RunInput } from './schemas'

export const useStartChat = () => {
  const qc = useQueryClient()
  const run = useCallback(
    async (title: string, message: string, attachment?: string | PickedFile, replace?: boolean, intent?: ChatIntent, context?: RunInput['context']) => {
      try {
        const conv = await createConversation(title.slice(0, 300))
        void qc.invalidateQueries({ queryKey: ['conversations'] })
        if (replace) router.replace(`/chat/${conv.id}`)
        else router.push(`/chat/${conv.id}`)
        send(conv.id, message, attachment, intent, context)
      } catch (err) {
        if (isConsentRequired(err)) {
          holdOpen({ title, message, attachment, intent, context })
          askConsent(true)
          return
        }
        Alert.alert('대화를 시작하지 못했어요', '잠시 뒤에 다시 해 주세요.')
      }
    },
    [qc],
  )
  useEffect(() => {
    bindOpenChat((p) => void run(p.title, p.message, p.attachment, undefined, p.intent, p.context))
  }, [run])
  return run
}

export const useConversationList = () =>
  useQuery({ queryKey: ['conversations', 'all'], queryFn: () => chatApi.conversations({ limit: 100 }) })

/** One conversation by id: GET /conversations/:id (the list stops at 100), falling back to the cached list row when that fails. */
export const useConversation = (id: string) => {
  const qc = useQueryClient()
  const listed = () => qc.getQueryData<ListEnvelope<ConversationRow>>(['conversations', 'all'])?.data.find((x) => x.id === id)
  const q = useQuery({ queryKey: ['conversations', 'one', id], queryFn: () => chatApi.conversation(id), initialData: listed, retry: retryUnlessMissing })
  const data = q.data ?? listed()
  return { data, failed: !data && q.isError, loading: !data && q.isFetching, retry: () => void q.refetch() }
}

export const useRenameConversation = (id: string, revision: number | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => {
      if (revision === undefined) throw new Error('missing conversation')
      return renameConversation(id, revision, title)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
    onError: () => Alert.alert('이름을 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const usePinConversation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: ConversationRow) => pinConversation(row.id, row.revision, !row.pinned),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['conversations'] }),
    onError: () => Alert.alert('고정을 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useArchiveConversation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: ConversationRow) => archiveConversation(row.id, row.revision),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['conversations'] }),
    onError: () => Alert.alert('보관하지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useUnarchiveConversation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: ConversationRow) => unarchiveConversation(row.id, row.revision),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['conversations'] }),
    onError: () => Alert.alert('보관을 해제하지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useDeleteConversation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: (_d, id) => {
      forget(id)
      void qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => Alert.alert('대화를 삭제하지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useArchivedConversations = (enabled: boolean) =>
  useQuery({ queryKey: ['conversations', 'archived'], queryFn: () => chatApi.conversations({ archived: 'true', limit: 100 }), enabled })

export const useMe = () => {
  const session = useSession((s) => s.session)
  const profile = useQuery({ queryKey: ['me', 'profile'], queryFn: fetchMyProfile })
  const name = profile.data?.displayName ?? session?.user.displayName ?? '나'
  return { name, given: name.length > 2 ? name.slice(-2) : name, profile: profile.data }
}

export const useChatDocs = (enabled = true) =>
  useQuery({ queryKey: CHAT_DOCS_KEY, queryFn: chatApi.docs, enabled })

export const useUploadChatDoc = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const r = await pickDocument(CHAT_DOC_OPTIONS)
      const f = r.canceled ? null : r.assets[0]
      if (!f) return
      if ((f.size ?? 0) > 20_000_000) throw new Error('too big')
      await chatApi.addDoc(f)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'sources'] }),
    onError: (e) => Alert.alert('올리지 못했어요', e.message === 'too big' ? '20MB까지 올릴 수 있어요.' : '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useChatAccount = (enabled: boolean) =>
  useQuery({ queryKey: ['chat', 'account'], queryFn: chatApi.account, enabled })

export const useRecentConversations = (enabled: boolean) =>
  useQuery({ queryKey: ['conversations', 'recent'], queryFn: () => chatApi.conversations({ limit: 4 }), enabled })

const oneShare = exclusive()
const shareAs = (name: string, bytes: Uint8Array, mimeType?: string) => shareBytes(cacheName(name), bytes, mimeType)

export const useOpenArtifact = () =>
  useMutation({
    mutationFn: ({ url, name }: { url: string; name: string }) => oneShare(async () => shareAs(name, await fetchArtifactBytes(url))),
    onError: () => Alert.alert('파일을 열지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })

export type SharedFile = { documentId: string; name?: string } | { sourceId: string; name: string; mimeType?: string }

/** Shares the file itself: a document through its authenticated PDF export, an upload as its stored bytes. */
export const useShareFile = () =>
  useMutation({
    mutationFn: (f: SharedFile) =>
      oneShare(async () => {
        if ('sourceId' in f) return shareAs(f.name, await fetchSourceBytes(f.sourceId), f.mimeType)
        const pdf = await fetchDocumentPdf(f.documentId)
        return shareAs(pdfName(f.name ?? pdf.title), pdf.bytes, 'application/pdf')
      }),
    onError: (e) => showToast({ message: shareErrorText(e) }),
  })

export const useAccessMode = () => {
  const qc = useQueryClient()
  const server = useMySettings(true).data?.aiAccessMode
  const mode = usePrefs((s) => s.accessMode)
  useEffect(() => {
    if (server) usePrefs.setState({ accessMode: server })
  }, [server])
  const save = useMutation({
    mutationFn: pickAccessMode,
    onSuccess: (s) => qc.setQueryData(['me', 'settings'], s),
    onError: () => Alert.alert('바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
  return { mode, pick: save.mutate }
}

export const useQuickStart = (key: string) =>
  useQuery({ queryKey: ['chat', 'quick-start', key], queryFn: () => chatApi.quickStart(key) })

export const useMentionGroups = (): MentionGroup[] => {
  const bookmarks = useQuery({ queryKey: ['me', 'bookmarks', 'mention'], queryFn: fetchMentionBookmarks })
  const docs = useChatDocs()
  const links = useMyLinks(true)
  return useMemo(
    () => [
      {
        title: '북마크 공고',
        items: (bookmarks.data?.data ?? []).map((p) => ({ id: p.id, kind: 'job' as const, title: p.title, sub: `${p.company} · ${p.location}`, tag: p.company.slice(0, 1) })),
      },
      {
        title: '마이 › 서류',
        items: (docs.data ?? []).map((d) => ({ id: d.id, kind: 'doc' as const, title: d.fileName, sub: d.aiMade ? docAiSub(ago(d.createdAt)) : `${ago(d.createdAt)} · ${Math.round(d.size / 1000)}KB` })),
      },
      {
        title: '내 링크',
        items: (links.data?.data ?? []).map((l) => ({ id: l.id, kind: 'link' as const, title: l.title, sub: linkMentionSub(LINK_KIND_LABEL[l.kind], l.url) })),
      },
      { title: '바로가기', items: QUICK_STARTS.filter((q) => (MENTION_SHORTCUT_KEYS as readonly string[]).includes(q.key)).map((q) => ({ id: q.key, kind: 'shortcut' as const, title: q.label, sub: '' })) },
    ],
    [bookmarks.data, docs.data, links.data],
  )
}
