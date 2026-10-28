import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, type JobCategory, type ProfileFilters } from '@push/api-client'
import type { SheetFilters } from '../utils'
import { fetchOfferBookmarks, fetchProfile, fetchProfileCount, fetchProfileList, followProfile, sendProfileOffer, unfollowProfile } from './fetchers'

export const useProfileList = (category: JobCategory[], sheet: SheetFilters) =>
  useInfiniteQuery({
    queryKey: ['profiles', 'list', category, sheet],
    queryFn: ({ pageParam }) => fetchProfileList(category, sheet, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

export const useProfileCount = (key: unknown[], query: ProfileFilters, enabled: boolean) =>
  useQuery({ queryKey: ['profiles', 'count', ...key], queryFn: () => fetchProfileCount(query), enabled }).data?.page.total

export const useOfferBookmarks = (visible: boolean) =>
  useQuery({
    queryKey: ['me', 'bookmarks', 'offer-pick'],
    queryFn: fetchOfferBookmarks,
    enabled: visible,
  })

export const useSendOffer = (userId: string, message: string, postingId: string | undefined, onDone: () => void, onFail: (message: string) => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => sendProfileOffer(userId, message.trim(), postingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profiles'] })
      onDone()
    },
    onError: (e) =>
      onFail(e instanceof ApiError && e.code === 'CONFLICT' ? '이미 제안을 보냈어요.' : '제안을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'),
  })
}

export const useProfile = (id: string) => useQuery({ queryKey: ['profiles', 'detail', id], queryFn: () => fetchProfile(id) })

export const useFollow = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (on: boolean) => (on ? followProfile(id) : unfollowProfile(id)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export const useInvalidateProfileDetail = (id: string) => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['profiles', 'detail', id] })
}
