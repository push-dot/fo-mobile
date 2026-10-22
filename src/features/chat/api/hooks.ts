import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LinkKind, Settings } from '@push/api-client'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { api, useSession } from '../../../shared/infrastructure'
import { QUICK_STARTS } from '../quick-starts'
import type { MentionGroup } from '../mentions'
import { forget, pickAccessMode, send, usePrefs } from '../store'
import { chatApi } from './client'
import { openArtifact, openExternal, pickChatDoc } from './files'

export const useStartChat = () => {
  const qc = useQueryClient()
  return async (title: string, message: string, attachment?: string, replace?: boolean) => {
    try {
      const conv = await api.conversations.create(title.slice(0, 300))
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      if (replace) router.replace(`/chat/${conv.id}`)
      else router.push(`/chat/${conv.id}`)
      send(conv.id, message, attachment)
    } catch {
      Alert.alert('대화를 시작하지 못했어요', '잠시 뒤에 다시 해 주세요.')
    }
  }
}

export const useConversationList = () =>
  useQuery({ queryKey: ['conversations', 'all'], queryFn: () => chatApi.conversations({ limit: 100 }) })

export const useRenameConversation = (id: string, revision: number | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => {
      if (revision === undefined) throw new Error('missing conversation')
      return api.conversations.rename(id, revision, title)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
    onError: () => Alert.alert('이름을 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useArchiveConversation = (id: string, revision: number | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => {
      if (revision === undefined) throw new Error('missing conversation')
      return api.conversations.archive(id, revision)
    },
    onSuccess: () => {
      forget(id)
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      router.dismissTo('/chat')
    },
    onError: () => Alert.alert('대화를 지우지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useMe = () => {
  const session = useSession((s) => s.session)
  const profile = useQuery({ queryKey: ['me', 'profile'], queryFn: api.me.profile })
  const name = profile.data?.displayName ?? session?.user.displayName ?? '나'
  return { name, given: name.length > 2 ? name.slice(-2) : name, profile: profile.data }
}

export const useChatBookmarks = (enabled: boolean) =>
  useQuery({ queryKey: ['me', 'bookmarks', 'chat'], queryFn: () => api.me.bookmarks({ limit: 100 }), enabled })

export const useChatDocs = (enabled = true) =>
  useQuery({ queryKey: ['chat', 'docs'], queryFn: chatApi.docs, enabled })

export const useUploadChatDoc = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const r = await pickChatDoc()
      const f = r.canceled ? null : r.assets[0]
      if (!f) return
      if ((f.size ?? 0) > 20_000_000) throw new Error('too big')
      await chatApi.addDoc(f)
    },
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['chat', 'docs'] }), qc.invalidateQueries({ queryKey: ['me', 'sources'] })]),
    onError: (e) => Alert.alert('올리지 못했어요', e.message === 'too big' ? '20MB까지 올릴 수 있어요.' : '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useChatAccount = (enabled: boolean) =>
  useQuery({ queryKey: ['chat', 'account'], queryFn: chatApi.account, enabled })

export const useRecentConversations = (enabled: boolean) =>
  useQuery({ queryKey: ['conversations', 'recent'], queryFn: () => chatApi.conversations({ limit: 4 }), enabled })

export const useOpenArtifact = () =>
  useMutation({
    mutationFn: ({ url, name }: { url: string; name: string }) => openArtifact(url, name),
    onError: () => Alert.alert('파일을 열지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })

export const useCheckoutUltra = () =>
  useMutation({
    mutationFn: () => chatApi.checkout('ULTRA'),
    onSuccess: ({ url }) => void openExternal(url),
    onError: () => Alert.alert('결제 화면을 열지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })

export const useMySettings = (enabled: boolean) =>
  useQuery({ queryKey: ['me', 'settings'], queryFn: api.me.settings, enabled })

export const useUpdateChatSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => api.me.updateSettings(patch),
    onSuccess: (s) => qc.setQueryData(['me', 'settings'], s),
    onError: () => Alert.alert('바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

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

export const useMyLinks = (enabled: boolean) =>
  useQuery({ queryKey: ['me', 'links'], queryFn: () => api.me.links(undefined, { limit: 100 }), enabled })

export const useDeleteLink = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.me.deleteLink(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'links'] }),
    onError: () => Alert.alert('지우지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useAddLink = (onAdded: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { url: string; kind?: LinkKind; aiRead: boolean }) => api.me.addLink(body),
    onSuccess: () => (void qc.invalidateQueries({ queryKey: ['me', 'links'] }), onAdded()),
    onError: () => Alert.alert('추가하지 못했어요', '링크 주소를 확인해 주세요.'),
  })
}

export const useMentionGroups = (): MentionGroup[] => {
  const bookmarks = useQuery({ queryKey: ['me', 'bookmarks', 'mention'], queryFn: () => api.me.bookmarks({ limit: 20 }) })
  const docs = useChatDocs()
  const links = useQuery({ queryKey: ['me', 'links'], queryFn: () => api.me.links(undefined, { limit: 50 }) })
  return useMemo(
    () => [
      {
        title: '북마크 공고',
        items: (bookmarks.data?.data ?? []).map((p) => ({ id: p.id, kind: 'job' as const, title: p.title, sub: `${p.company} · ${p.location}`, tag: p.company.slice(0, 1) })),
      },
      {
        title: '마이 › 서류',
        items: (docs.data ?? []).map((d) => ({ id: d.id, kind: 'doc' as const, title: d.fileName, sub: d.aiMade ? 'AI로 만듦' : `${Math.round(d.size / 1000)}KB`, tag: d.fileName.split('.').pop()!.toUpperCase() })),
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
