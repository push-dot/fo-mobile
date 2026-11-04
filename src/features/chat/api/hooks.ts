import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ChatIntent } from '@push/api-client'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { useMyLinks, useMySettings } from '@/features/my'
import { pickDocument, saveToCache, shareFile, useSession } from '../../../shared/infrastructure'
import { CHAT_DOC_OPTIONS, CHAT_DOCS_KEY, QUICK_STARTS } from '../constants'
import { ago } from '../utils/ago'
import { cacheName } from '../utils/cache-name'
import type { MentionGroup } from '../utils/mentions'
import { isConsentRequired } from '../utils/consent'
import { askConsent, bindOpenChat, forget, holdOpen, pickAccessMode, send, usePrefs } from '../stores'
import {
  archiveConversation,
  chatApi,
  createConversation,
  deleteConversation,
  fetchArtifactBytes,
  fetchMentionBookmarks,
  fetchMyProfile,
  pinConversation,
  renameConversation,
  unarchiveConversation,
} from './fetchers'
import type { ConversationRow } from './schemas'

export const useStartChat = () => {
  const qc = useQueryClient()
  const run = useCallback(
    async (title: string, message: string, attachment?: string, replace?: boolean, intent?: ChatIntent, context?: { documentId?: string }) => {
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

export const useOpenArtifact = () =>
  useMutation({
    mutationFn: async ({ url, name }: { url: string; name: string }) => {
      const uri = await saveToCache(cacheName(name), await fetchArtifactBytes(url))
      await shareFile(uri, name)
    },
    onError: () => Alert.alert('파일을 열지 못했어요', '잠시 뒤에 다시 해 주세요.'),
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
        items: (docs.data ?? []).map((d) => ({ id: d.id, kind: 'doc' as const, title: d.fileName, sub: d.aiMade ? `AI로 만듦 · ${ago(d.createdAt)}` : `${ago(d.createdAt)} · ${Math.round(d.size / 1000)}KB` })),
      },
      {
        title: '내 링크',
        items: (links.data?.data ?? []).map((l) => ({ id: l.id, kind: 'link' as const, title: l.title, sub: l.url.replace(/^https?:\/\//, '') })),
      },
      { title: '바로가기', items: QUICK_STARTS.map((q) => ({ id: q.key, kind: 'shortcut' as const, title: q.label, sub: '' })) },
    ],
    [bookmarks.data, docs.data, links.data],
  )
}
