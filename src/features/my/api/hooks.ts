import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { type LinkKind, type MyPostsSort, type Offer, type Profile, type Settings, type UserMemory } from '@push/api-client'
import { DAY, NEXT_EVENT_DAYS } from '../constants'
import type { CalendarEvent, PickedFile } from '../types'
import { askConfirm, showToast } from '@/shared/components'
import { mockUploadHeldAt, useSession } from '@/shared/infrastructure'
import { marketingResult, nextEventFor, type PostsView, OFFER_MENU_COPY, offerMenuSections, viewerBox } from '../utils'
import {
  acceptOffer,
  addLink,
  archiveOffer,
  blockUser,
  fetchBlocked,
  unblockUser,
  reportOffer,
  unarchiveOffer,
  declineOffer,
  duplicateDocument,
  fetchAuthMe,
  fetchBookmarkList,
  fetchCommentedPosts,
  fetchFollowers,
  fetchFollows,
  fetchLinks,
  fetchAppliedApplications,
  fetchApplication,
  fetchMyApplications,
  fetchMyBookmarks,
  fetchMyPosts,
  fetchSavedPosts,
  fetchMyProfile,
  fetchOffer,
  fetchOfferMessages,
  fetchArchivedOffers,
  fetchOffers,
  fetchPosting,
  convertDocumentProfile,
  fetchConsents,
  fetchDocument,
  fetchDocuments,
  renameDocument,
  archiveDocument,
  fetchDocumentVersions,
  fetchEvents,
  fetchSettings,
  fetchMemories,
  updateMemory,
  removeMemory,
  clearMemories,
  fetchSource,
  fetchUnreadOffers,
  followProfile,
  ingestJobQuery,
  myApi,
  sendOfferMessage,
  setDocumentBaseProfile,
  unfollowProfile,
  unbookmarkPosting,
  grantReferenceAccess,
  updateProfile,
  updateMarketingConsent,
  updateReferenceConsent,
  updateSettings,
} from './fetchers'
import { ingestEnabled } from '../utils/ingest-enabled'

export const unreadOffersQuery = queryOptions({ queryKey: ['me', 'offers', 'received', 'unread'], queryFn: fetchUnreadOffers })
export const myProfileQuery = queryOptions({ queryKey: ['me', 'profile'], queryFn: fetchMyProfile })
export const consentsQuery = queryOptions({ queryKey: ['me', 'consents'], queryFn: fetchConsents })
export const settingsQuery = queryOptions({ queryKey: ['me', 'settings'], queryFn: fetchSettings })

export const useUnreadOffers = () => useQuery({ ...unreadOffersQuery, select: (r) => r.data.filter((o) => !o.readAt).length })

export const useMyProfile = () => useQuery(myProfileQuery)

export const useReferenceConsent = () => {
  const qc = useQueryClient()
  const q = useQuery(consentsQuery)
  const m = useMutation({
    mutationFn: updateReferenceConsent,
    onSuccess: (data) => qc.setQueryData(consentsQuery.queryKey, data),
    onError: () => Alert.alert('동의를 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
  const grant = useMutation({
    mutationFn: grantReferenceAccess,
    onSuccess: (data) => {
      qc.setQueryData(consentsQuery.queryKey, data)
      void qc.invalidateQueries({ queryKey: settingsQuery.queryKey })
    },
    onError: () => Alert.alert('동의를 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
  return { data: q.data, save: m.mutate, grant: grant.mutate, saving: m.isPending }
}

export const useMarketingConsent = () => {
  const qc = useQueryClient()
  const q = useQuery(consentsQuery)
  const m = useMutation({
    mutationFn: updateMarketingConsent,
    onSuccess: (data) => {
      qc.setQueryData(consentsQuery.queryKey, data)
      showToast({ message: marketingResult(data.terms?.marketing ?? false, data.terms?.marketingAt ?? null) })
    },
    onError: () => Alert.alert('알림 수신 설정을 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
  return { on: !!q.data?.terms?.marketing, save: m.mutate }
}

export const useAuthMe = () => useQuery({ queryKey: ['auth', 'me'], queryFn: fetchAuthMe })

export const useSources = () =>
  useQuery({ queryKey: ['me', 'sources'], queryFn: () => myApi.sources() })

export const useDocuments = () => useQuery({ queryKey: ['documents'], queryFn: fetchDocuments })

export const useDocument = (id: string) =>
  useQuery({ queryKey: ['documents', id], queryFn: () => fetchDocument(id), enabled: !!id })

export const useDocumentVersions = (id: string) =>
  useQuery({
    queryKey: ['documents', id, 'versions'],
    queryFn: () => fetchDocumentVersions(id),
    enabled: !!id,
  })

export const useConvertDocument = (onDone: (documentId: string, jobId?: string) => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => convertDocumentProfile(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['documents'] })
      if (data.documentId) onDone(data.documentId, data.jobId)
    },
    onError: () => Alert.alert('지원용 프로필을 만들지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

export const useSetBaseProfile = (onDone: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => setDocumentBaseProfile(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me', 'profile'] })
      void qc.invalidateQueries({ queryKey: ['documents'] })
      onDone()
    },
    onError: () => Alert.alert('기본 프로필로 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

const useDocumentWrite = <V,>(write: (v: V) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: write,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
    onError: () => {
      void qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useRenameDocument = (doc: { id: string; revision: number } | undefined) =>
  useDocumentWrite((title: string) => renameDocument(doc!.id, doc!.revision, title))

export const useArchiveDocument = (doc: { id: string; revision: number } | undefined) =>
  useDocumentWrite(() => archiveDocument(doc!.id, doc!.revision))

export const useDuplicateDocument = () => useDocumentWrite((id: string) => duplicateDocument(id))

export const useIngestJob = (jobId: string | undefined, enabled = true) =>
  useQuery({ ...ingestJobQuery(jobId), enabled: ingestEnabled(jobId, enabled) })

type Box = 'received' | 'sent'

export const useOffers = (box: Box) =>
  useQuery({ queryKey: ['me', 'offers', box], queryFn: () => fetchOffers(box) })

export const useArchivedOffers = (box: Box) =>
  useQuery({ queryKey: ['me', 'offers', box, 'archived'], queryFn: () => fetchArchivedOffers(box) })

export const useSettings = () => {
  const qc = useQueryClient()
  const key = settingsQuery.queryKey
  const q = useQuery(settingsQuery)
  const m = useMutation({
    mutationFn: (patch: Partial<Settings>) => updateSettings(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData(key)
      if (prev) qc.setQueryData(key, { ...prev, ...patch })
      return prev
    },
    onError: (_e, _p, prev) => {
      if (prev) qc.setQueryData(key, prev)
      Alert.alert('설정을 바꾸지 못했어요', '잠시 뒤에 다시 시도해 주세요.')
    },
    onSuccess: (s) => qc.setQueryData(key, s),
  })
  return { s: q.data, set: m.mutate, isError: q.isError, refetch: q.refetch }
}

export const useBlocked = () => useQuery({ queryKey: ['me', 'blocks'], queryFn: fetchBlocked, refetchOnMount: 'always' })

export const useUnblock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unblockUser,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['me', 'blocks'] }),
        qc.invalidateQueries({ queryKey: ['me', 'offers'] }),
        qc.invalidateQueries({ queryKey: ['chat', 'quick-start'] }),
      ]),
    onError: () => showToast({ message: OFFER_MENU_COPY.failed, tone: 'error' }),
  })
}

export const useMySettings = (enabled: boolean) => useQuery({ ...settingsQuery, enabled })

export const useUpdateSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => updateSettings(patch),
    onSuccess: (s) => qc.setQueryData(settingsQuery.queryKey, s),
    onError: () => Alert.alert('바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
}

const MEMORIES_KEY = ['me', 'memories']

export const useMemories = (enabled = true) => useQuery({ queryKey: MEMORIES_KEY, queryFn: fetchMemories, enabled })

const useMemoriesMutation = <V,>(mutationFn: (v: V) => Promise<unknown>, next: (rows: UserMemory[], v: V) => UserMemory[], failed: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: MEMORIES_KEY })
      const prev = qc.getQueryData<UserMemory[]>(MEMORIES_KEY)
      if (prev) qc.setQueryData(MEMORIES_KEY, next(prev, v))
      return prev
    },
    onError: (_e, _v, prev) => {
      if (prev) qc.setQueryData(MEMORIES_KEY, prev)
      Alert.alert(failed, '잠시 뒤에 다시 해 주세요.')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MEMORIES_KEY }),
  })
}

export const useUpdateMemory = () =>
  useMemoriesMutation(updateMemory, (rows, { id, text }) => rows.map((m) => (m.id === id ? { ...m, text } : m)), '기억을 고치지 못했어요')

export const useRemoveMemory = () => useMemoriesMutation(removeMemory, (rows, id) => rows.filter((m) => m.id !== id), '기억을 지우지 못했어요')

export const useClearMemories = () => useMemoriesMutation<void>(clearMemories, () => [], '기억을 지우지 못했어요')

export const useBookmarkList = (enabled: boolean) =>
  useQuery({ queryKey: ['me', 'bookmarks', 'chat'], queryFn: fetchBookmarkList, enabled })

export const useMyLinks = (enabled: boolean) =>
  useQuery({ queryKey: ['me', 'links'], queryFn: fetchLinks, enabled })

export const useAddLink = (onAdded: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { url: string; kind?: LinkKind; aiRead: boolean }) => addLink(body),
    onSuccess: () => (void qc.invalidateQueries({ queryKey: ['me', 'links'] }), onAdded()),
    onError: () => Alert.alert('추가하지 못했어요', '링크 주소를 확인해 주세요.'),
  })
}

export const useMyApplications = () =>
  useQuery({
    queryKey: ['applications', 'my-list'],
    queryFn: fetchMyApplications,
  })

export const useApplication = (id: string) =>
  useQuery({
    queryKey: ['applications', 'detail', id],
    queryFn: () => fetchApplication(id),
  })

export const useAppliedApplications = () =>
  useQuery({
    queryKey: ['applications', 'applied-list'],
    queryFn: fetchAppliedApplications,
  })

export const useMyBookmarks = () => {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['me', 'bookmarks', 'my-list'],
    queryFn: fetchMyBookmarks,
  })
  const unbookmark = useMutation({
    mutationFn: unbookmarkPosting,
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: ['me', 'bookmarks'] }), qc.invalidateQueries({ queryKey: ['calendar'] })]),
  })
  return { query, unbookmark }
}

export const useFollowToggle = (userId: string, setFollowing: (next: boolean) => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (next: boolean) => (next ? followProfile(userId) : unfollowProfile(userId)),
    onMutate: (next) => setFollowing(next),
    onError: (_e, next) => setFollowing(!next),
    onSettled: () => qc.invalidateQueries({ queryKey: ['me', 'follows'] }),
  })
}

export const useMyFollows = (enabled = true) => useQuery({ queryKey: ['me', 'follows'], queryFn: fetchFollows, enabled })

export const useMyFollowers = (enabled = true) => useQuery({ queryKey: ['me', 'followers'], queryFn: fetchFollowers, enabled })

const POSTS_LISTS = {
  mine: { key: 'posts', fetch: fetchMyPosts },
  commented: { key: 'commented-posts', fetch: fetchCommentedPosts },
  saved: { key: 'saved-posts', fetch: fetchSavedPosts },
} as const

export const usePostsList = (view: PostsView, sort: MyPostsSort) =>
  useQuery({ queryKey: ['me', POSTS_LISTS[view].key, sort], queryFn: () => POSTS_LISTS[view].fetch(sort) })

export const calendarEventsQuery = (from: string, to: string) =>
  queryOptions({ queryKey: ['calendar', from, to], queryFn: () => fetchEvents(from, to) })

export const useCalendarEvents = (from: string, to: string) => useQuery(calendarEventsQuery(from, to))

export const useGoogleConnected = () => useQuery({ queryKey: ['integrations', 'google'], queryFn: myApi.googleConnected })

export const useNextEvent = (applicationId: string) =>
  useQuery({
    queryKey: ['calendar', 'next', applicationId],
    queryFn: async () => {
      const now = Date.now()
      const r = await fetchEvents(new Date(now).toISOString(), new Date(now + NEXT_EVENT_DAYS * DAY).toISOString())
      return nextEventFor(r.data, applicationId)
    },
  })

export const useAddCalendarEvent = (onAdded: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Pick<CalendarEvent, 'type' | 'title' | 'startsAt'>) => myApi.addEvent(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar'] })
      onAdded()
    },
  })
}

export const useSource = (id: string) =>
  useQuery({ queryKey: ['me', 'sources', id], queryFn: () => fetchSource(id), enabled: !!id })

export const useRenameSource = (id: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileName: string) => myApi.renameSource(id!, fileName),
    onSettled: () => qc.invalidateQueries({ queryKey: ['me', 'sources'] }),
  })
}

export const useResumeDraft = (id: string) =>
  useQuery({
    queryKey: ['me', 'sources', id, 'draft'],
    queryFn: () => myApi.resumeDraft(id),
  })

type Patch = Partial<Profile> & { avatarKey?: string }

export const useSaveProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Patch) => updateProfile(patch),
    onSuccess: (p) => {
      qc.setQueryData(['me', 'profile'], p)
      router.back()
    },
    onError: () => Alert.alert('저장하지 못했어요', '잠시 뒤에 다시 저장해 주세요.'),
  })
}

export const useOffer = (id: string) => {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ['me', 'offer', id],
    queryFn: async () => {
      const o = await fetchOffer(id)
      void qc.invalidateQueries({ queryKey: ['me', 'offers'] })
      return o
    },
  })
}

export const useOfferDecision = (id: string, reply: string, onAccepted: () => void) => {
  const qc = useQueryClient()
  const done = (next: Offer) => {
    qc.setQueryData(['me', 'offer', id], next)
    void qc.invalidateQueries({ queryKey: ['me', 'offers'] })
    void qc.invalidateQueries({ queryKey: ['me', 'offer', id, 'messages'] })
  }
  const accept = useMutation({
    mutationFn: () => acceptOffer(id, reply.trim() || undefined),
    onSuccess: (next) => {
      onAccepted()
      done(next)
    },
    onError: () => Alert.alert('수락하지 못했어요', '잠시 뒤에 다시 시도해 주세요.'),
  })
  const decline = useMutation({
    mutationFn: () => declineOffer(id),
    onSuccess: done,
    onError: () => Alert.alert('거절하지 못했어요', '잠시 뒤에 다시 시도해 주세요.'),
  })
  return { accept, decline }
}

export const useViewerBox = (offer: Offer | undefined, hint: Box): Box => {
  const viewerId = useSession((s) => s.session?.user.id)
  return offer ? viewerBox(offer, viewerId, hint) : hint
}

export const useOfferMenu = (offer: Offer | undefined, box: Box) => {
  const qc = useQueryClient()
  if (!offer) return null
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['me', 'offers'] }),
      qc.invalidateQueries({ queryKey: ['me', 'offer', offer.id] }),
      qc.invalidateQueries({ queryKey: ['me', 'blocks'] }),
      qc.invalidateQueries({ queryKey: ['chat', 'quick-start'] }),
    ])
  return offerMenuSections(offer, box, {
    archive: archiveOffer,
    unarchive: unarchiveOffer,
    report: reportOffer,
    block: blockUser,
    refresh,
    back: router.back,
    toast: showToast,
    profile: (userId) => router.push(`/profiles/${userId}`),
    confirm: askConfirm,
  })
}

export const usePostingDetail = (postingId: string | undefined) =>
  useQuery({
    queryKey: ['postings', 'detail', postingId],
    queryFn: () => fetchPosting(postingId!),
    enabled: !!postingId,
  })

export const useOfferMessages = (offerId: string) => {
  const qc = useQueryClient()
  const key = ['me', 'offer', offerId, 'messages']
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchOfferMessages(offerId),
  })
  const send = useMutation({
    mutationFn: (body: string) => sendOfferMessage(offerId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
  return { data: query.data, send }
}

type Upload = { name: string; size: number; progress: number }

const settleUpload = async (file: PickedFile, isCancelled: () => boolean, onDone: (() => void) | undefined, finish: () => void) => {
  try {
    const s = await myApi.upload(file)
    if (isCancelled()) await myApi.remove(s.id).catch(() => undefined)
    else onDone?.()
  } catch {
    if (!isCancelled())
      Alert.alert('파일을 올리지 못했어요', '네트워크를 확인하고 다시 올려 주세요.')
  } finally {
    finish()
  }
}

export const useUpload = (onDone?: () => void) => {
  const qc = useQueryClient()
  const [upload, setUpload] = useState<Upload | null>(null)
  const current = useRef<{ cancelled: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => clearInterval(timer.current ?? undefined), [])

  const start = async (file: PickedFile) => {
    clearInterval(timer.current ?? undefined)
    const run = { cancelled: false }
    current.current = run
    const size = file.size ?? 0
    setUpload({ name: file.name, size, progress: 0.05 })
    timer.current = setInterval(
      () => setUpload((u) => u && { ...u, progress: mockUploadHeldAt() ?? u.progress + (0.9 - u.progress) * 0.12 }),
      200,
    )
    await settleUpload(
      file,
      () => run.cancelled,
      onDone,
      () => {
        void qc.invalidateQueries({ queryKey: ['me', 'sources'] })
        if (current.current !== run) return
        clearInterval(timer.current ?? undefined)
        setUpload(null)
      },
    )
  }
  const cancel = () => {
    if (current.current) current.current.cancelled = true
    clearInterval(timer.current ?? undefined)
    setUpload(null)
  }
  return { upload, start, cancel }
}
