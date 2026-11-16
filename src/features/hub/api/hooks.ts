import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JobCategory, ProfileFilters } from '@push/api-client'
import { sendOfferError, type SheetFilters } from '../utils'
import { fetchOfferPostings, fetchProfile, fetchProfileCount, fetchProfileList, followProfile, sendProfileOffer, unfollowProfile } from './fetchers'

export const useProfileList = (category: JobCategory[], sheet: SheetFilters) =>
  useInfiniteQuery({
    queryKey: ['profiles', 'list', category, sheet],
    queryFn: ({ pageParam }) => fetchProfileList(category, sheet, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

export const useProfileCount = (key: unknown[], query: ProfileFilters, enabled: boolean) =>
  useQuery({ queryKey: ['profiles', 'count', ...key], queryFn: () => fetchProfileCount(query), enabled }).data?.page.total

export const useOfferPostings = (visible: boolean) =>
  useQuery({
    queryKey: ['company', 'postings', 'offer-pick'],
    queryFn: fetchOfferPostings,
    retry: false,
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
      onFail(sendOfferError(e)),
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
