import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { jobQuery, type Offer, type Posting, type Profile, type Settings } from '@push/api-client'
import { api } from '../../../shared/infrastructure'
import type { CalendarEvent, PickedFile } from '../types'
import { myApi } from './client'

export const useUnreadOffers = () =>
  useQuery({
    queryKey: ['me', 'offers', 'received', 'unread'],
    queryFn: () => api.me.offers('received', { limit: 50 }),
    select: (r) => r.data.filter((o) => !o.readAt).length,
  })

export const useMyProfile = () => useQuery({ queryKey: ['me', 'profile'], queryFn: api.me.profile })

export const useAuthMe = () => useQuery({ queryKey: ['auth', 'me'], queryFn: api.auth.me })

export const useSources = () =>
  useQuery({ queryKey: ['me', 'sources'], queryFn: () => myApi.sources() })

export const useIngestJob = (jobId: string | undefined) => useQuery(jobQuery(api.jobs, jobId))

type Box = 'received' | 'sent'

export const useOffers = (box: Box) =>
  useQuery({ queryKey: ['me', 'offers', box], queryFn: () => api.me.offers(box, { limit: 50 }) })

export const useSettings = () => {
  const qc = useQueryClient()
  const key = ['me', 'settings']
  const q = useQuery({ queryKey: key, queryFn: api.me.settings })
  const m = useMutation({
    mutationFn: (patch: Partial<Settings>) => api.me.updateSettings(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Settings>(key)
      if (prev) qc.setQueryData(key, { ...prev, ...patch })
      return prev
    },
    onError: (_e, _p, prev) => {
      if (prev) qc.setQueryData(key, prev)
      Alert.alert('설정을 바꾸지 못했어요', '잠시 뒤에 다시 시도해 주세요.')
    },
    onSuccess: (s) => qc.setQueryData(key, s),
  })
  return { s: q.data, set: m.mutate }
}

// shortcut: lists load the first 50 items; switch to useInfiniteQuery if people keep more than that.
const FIRST = { limit: 50 }

export const useMyApplications = () =>
  useQuery({
    queryKey: ['applications', 'my-list'],
    queryFn: () => api.applications.list(FIRST),
  })

export const useMyBookmarks = () => {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['me', 'bookmarks', 'my-list'],
    queryFn: () => api.me.bookmarks(FIRST),
  })
  const unbookmark = useMutation({
    mutationFn: (p: Posting) => api.postings.unbookmark(p.id),
    onSettled: () => qc.invalidateQueries({ queryKey: ['me', 'bookmarks'] }),
  })
  return { query, unbookmark }
}

export const useFollowToggle = (userId: string, setFollowing: (next: boolean) => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (next: boolean) =>
      next ? api.profiles.follow(userId) : api.profiles.unfollow(userId),
    onMutate: (next) => setFollowing(next),
    onError: (_e, next) => setFollowing(!next),
    onSettled: () => qc.invalidateQueries({ queryKey: ['me', 'follows'] }),
  })
}

export const useMyFollows = () =>
  useQuery({ queryKey: ['me', 'follows'], queryFn: () => api.me.follows(FIRST) })

export const useMyFollowers = () =>
  useQuery({
    queryKey: ['me', 'followers'],
    queryFn: () => api.me.followers(FIRST),
  })

export const useMyPosts = () => useQuery({ queryKey: ['me', 'posts'], queryFn: () => api.me.posts(FIRST) })

export const useMyCommentedPosts = () =>
  useQuery({
    queryKey: ['me', 'commented-posts'],
    queryFn: () => api.me.commentedPosts(FIRST),
  })

export const useCalendarEvents = (from: string, to: string) =>
  useQuery({
    queryKey: ['calendar', from],
    queryFn: () => myApi.calendar(from, to),
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
  useQuery({ queryKey: ['me', 'sources', id], queryFn: () => api.sources.get(id) })

export const useResumeDraft = (id: string) =>
  useQuery({
    queryKey: ['me', 'sources', id, 'draft'],
    queryFn: () => myApi.resumeDraft(id),
  })

export const useRemoveSource = (onRemoved: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => myApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me', 'sources'] })
      onRemoved()
    },
  })
}

export const useApplyResumeProfile = (onDone: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => api.me.updateProfile(patch),
    onSuccess: (p) => {
      qc.setQueryData(['me', 'profile'], p)
      onDone()
      router.navigate({ pathname: '/my', params: { tab: 'profile' } })
    },
    onError: () => Alert.alert('프로필에 반영하지 못했어요', '잠시 뒤에 다시 반영해 주세요.'),
  })
}

type Patch = Partial<Profile> & { avatarKey?: string }

export const useSaveProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Patch) => api.me.updateProfile(patch),
    onSuccess: (p) => {
      qc.setQueryData(['me', 'profile'], p)
      router.back()
    },
    onError: () => Alert.alert('저장하지 못했어요', '잠시 뒤에 다시 저장해 주세요.'),
  })
}

export const useOffer = (id: string) => {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['me', 'offer', id],
    queryFn: () => api.me.offer(id),
  })
  const o = query.data
  useEffect(() => {
    if (o) void qc.invalidateQueries({ queryKey: ['me', 'offers'] })
  }, [o?.id, qc]) // eslint-disable-line react-hooks/exhaustive-deps
  return query
}

export const useOfferDecision = (id: string, reply: string, onAccepted: () => void) => {
  const qc = useQueryClient()
  const done = (next: Offer) => {
    qc.setQueryData(['me', 'offer', id], next)
    void qc.invalidateQueries({ queryKey: ['me', 'offers'] })
    void qc.invalidateQueries({ queryKey: ['me', 'offer', id, 'messages'] })
  }
  const accept = useMutation({
    mutationFn: () => api.me.acceptOffer(id, reply.trim() || undefined),
    onSuccess: (next) => {
      onAccepted()
      done(next)
    },
    onError: () => Alert.alert('수락하지 못했어요', '잠시 뒤에 다시 시도해 주세요.'),
  })
  const decline = useMutation({ mutationFn: () => api.me.declineOffer(id), onSuccess: done })
  return { accept, decline }
}

export const useOfferPosting = (postingId: string | undefined) =>
  useQuery({
    queryKey: ['postings', 'detail', postingId],
    queryFn: () => api.postings.get(postingId!),
    enabled: !!postingId,
  })

export const useOfferMessages = (offerId: string, onSent: () => void) => {
  const qc = useQueryClient()
  const key = ['me', 'offer', offerId, 'messages']
  const query = useQuery({
    queryKey: key,
    queryFn: () => api.me.offerMessages(offerId, { limit: 100 }),
  })
  const send = useMutation({
    mutationFn: (body: string) => api.me.sendOfferMessage(offerId, body),
    onSuccess: () => {
      onSent()
      void qc.invalidateQueries({ queryKey: key })
    },
    onError: () => Alert.alert('메시지를 보내지 못했어요', '잠시 뒤에 다시 보내 주세요.'),
  })
  return { data: query.data, send }
}

type Upload = { name: string; size: number; progress: number }

export const useUpload = (onDone: () => void) => {
  const qc = useQueryClient()
  const [upload, setUpload] = useState<Upload | null>(null)
  const cancelled = useRef(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => clearInterval(timer.current ?? undefined), [])

  const start = async (file: PickedFile) => {
    const size = file.size ?? 0
    cancelled.current = false
    setUpload({ name: file.name, size, progress: 0.05 })
    timer.current = setInterval(
      () => setUpload((u) => u && { ...u, progress: u.progress + (0.9 - u.progress) * 0.12 }),
      200,
    )
    try {
      const s = await myApi.upload(file)
      if (cancelled.current) await myApi.remove(s.id).catch(() => undefined)
      else onDone()
    } catch {
      if (!cancelled.current)
        Alert.alert('파일을 올리지 못했어요', '네트워크를 확인하고 다시 올려 주세요.')
    } finally {
      clearInterval(timer.current ?? undefined)
      setUpload(null)
      void qc.invalidateQueries({ queryKey: ['me', 'sources'] })
    }
  }
  const cancel = () => {
    cancelled.current = true
    clearInterval(timer.current ?? undefined)
    setUpload(null)
  }
  return { upload, start, cancel }
}
