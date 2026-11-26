import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiError, type ChatIntent } from '@push/api-client'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { botChatPath, type BotId } from '@/features/bots'
import { fetchProfileChange, undoProfileChange, useMyLinks, type PickedFile } from '@/features/my'
import { queryClient } from '@/providers/query-client'
import { shareBytes, useSession } from '../../../shared/infrastructure'
import { TOAST_ABOVE, showToast } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { CHAT_DOCS_KEY, docAiSub, linkMentionSub } from '../constants'
import { ago } from '../utils/ago'
import { LINK_KIND_LABEL } from '../utils/links'
import { cacheName } from '../utils/cache-name'
import { exclusive, pdfName, shareErrorText } from '../utils/share'
import type { MentionGroup } from '../utils/mentions'
import { isConsentRequired } from '@/shared/utility/consent-error'
import { askConsent, bindOpenChat, holdOpen, openBot, send } from '../stores'
import { chatApi, fetchArtifactBytes, fetchDocumentPdf, fetchSourceBytes, fetchMentionBookmarks, fetchMyProfile, fetchProfilePdf } from './fetchers'
import type { RunInput } from './schemas'

const RETRY_LATER = '잠시 뒤에 다시 해 주세요.'

const startChat = async (title: string, message: string, attachment?: string | PickedFile, replace?: boolean, intent?: ChatIntent, context?: RunInput['context']) => {
  try {
    const id = await openBot('push')
    const path = botChatPath(id as BotId)
    if (replace) router.replace(path)
    else router.push(path)
    send(id, message, attachment, intent, context)
  } catch (err) {
    if (isConsentRequired(err)) {
      holdOpen({ title, message, attachment, intent, context })
      askConsent()
      return
    }
    Alert.alert('대화를 시작하지 못했어요', RETRY_LATER)
  }
}

bindOpenChat((p) => void startChat(p.title, p.message, p.attachment, undefined, p.intent, p.context))

export const useStartChat = () => startChat

export const useMe = () => {
  const session = useSession((s) => s.session)
  const profile = useQuery({ queryKey: ['me', 'profile'], queryFn: fetchMyProfile })
  const name = profile.data?.displayName ?? session?.user.displayName ?? '나'
  return { name, given: name.length > 2 ? name.slice(-2) : name, profile: profile.data }
}

export const useChatDocs = (enabled = true) =>
  useQuery({ queryKey: CHAT_DOCS_KEY, queryFn: chatApi.docs, enabled })

export const useHubProfileId = (enabled = true) => useQuery({ queryKey: ['me', 'hub-profile-id'], queryFn: chatApi.hubProfileId, enabled })

export const useChatAccount = (enabled: boolean) =>
  useQuery({ queryKey: ['chat', 'account'], queryFn: chatApi.account, enabled })

const oneShare = exclusive()
const shareAs = (name: string, bytes: Uint8Array, mimeType?: string) => shareBytes(cacheName(name), bytes, mimeType)

export const useOpenArtifact = () =>
  useMutation({
    mutationFn: ({ url, name }: { url: string; name: string }) => oneShare(async () => shareAs(name, await fetchArtifactBytes(url))),
    onError: () => Alert.alert('파일을 열지 못했어요', RETRY_LATER),
  })

type SharedFile =
  | { documentId: string; name?: string }
  | { sourceId: string; name: string; mimeType?: string }
  | { profile: true; name: string; photo?: boolean }

export const useShareFile = () =>
  useMutation({
    mutationFn: (f: SharedFile) =>
      oneShare(async () => {
        if ('sourceId' in f) return shareAs(f.name, await fetchSourceBytes(f.sourceId), f.mimeType)
        if ('profile' in f) return shareAs(pdfName(f.name), await fetchProfilePdf(f.photo), 'application/pdf')
        const pdf = await fetchDocumentPdf(f.documentId)
        return shareAs(pdfName(f.name ?? pdf.title), pdf.bytes, 'application/pdf')
      }),
    onError: (e) => showToast({ message: shareErrorText(e), bottom: TOAST_ABOVE.tabs }),
  })

export const useQuickStart = (key: string) =>
  useQuery({ queryKey: ['chat', 'quick-start', key], queryFn: () => chatApi.quickStart(key) })

export const useMentionGroups = (): MentionGroup[] => {
  const bookmarks = useQuery({ queryKey: ['me', 'bookmarks', 'mention'], queryFn: fetchMentionBookmarks })
  const docs = useChatDocs()
  const links = useMyLinks(true)
  return [
    {
      title: '북마크 공고',
      items: (bookmarks.data?.data ?? []).map((p) => ({ id: p.id, kind: 'job' as const, title: p.title, sub: `${p.company} · ${p.location}`, tag: p.company.slice(0, 1) })),
    },
    {
      title: '마이 › 서류',
      items: (docs.data ?? []).map((d) => ({ id: d.id, kind: 'doc' as const, title: displayName(d.fileName), sub: d.aiMade ? docAiSub(ago(d.createdAt)) : `${ago(d.createdAt)} · ${Math.round(d.size / 1000)}KB` })),
    },
    {
      title: '내 링크',
      items: (links.data?.data ?? []).map((l) => ({ id: l.id, kind: 'link' as const, title: l.title, sub: linkMentionSub(LINK_KIND_LABEL[l.kind], l.url) })),
    },
  ]
}

export const useProfileUndo = (changeId: string) => {
  const key = ['me', 'profile-change', changeId]
  const change = useQuery({ queryKey: key, queryFn: () => fetchProfileChange(changeId), retry: false })
  const undo = useMutation({
    mutationFn: () => undoProfileChange(changeId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['me', 'profile'], profile)
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: key })
        return void queryClient.invalidateQueries({ queryKey: ['me', 'profile'] })
      }
      Alert.alert('되돌리지 못했어요', '잠시 뒤에 다시 해 주세요.')
    },
  })
  const gone = change.error instanceof ApiError && change.error.status === 404 && !undo.isSuccess
  return { gone, done: Boolean(change.data?.undone) || undo.isSuccess, pending: undo.isPending, undo: () => undo.mutate() }
}
