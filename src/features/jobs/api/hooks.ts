import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PostingFilters } from '@push/api-client'
import { applyDoc, toQuery, type Filters } from '../utils'
import type { ApplyDoc } from '../types'
import { applyToPosting, fetchApplyDocs, fetchMyProfile, fetchPosting, fetchPostingCount, fetchPostingLocations, fetchPostingPages, togglePostingBookmark } from './fetchers'

export const usePostingPages = (f: PostingFilters) =>
  useInfiniteQuery({
    queryKey: ['postings', 'list', f],
    queryFn: ({ pageParam }) => fetchPostingPages(f, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

export const useToggleBookmark = () => {
  const qc = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: togglePostingBookmark,
    onSettled: () => Promise.all(['postings', 'search', 'bookmarks'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  })
  return mutate
}

export const useGridTotal = (filters: PostingFilters) => usePostingPages(filters).data?.pages[0]?.page.total

export const usePostingCount = (draft: Filters) =>
  useQuery({
    queryKey: ['postings', 'count', toQuery(draft)],
    queryFn: () => fetchPostingCount(draft),
    placeholderData: keepPreviousData,
  })

export const useProfile = () => useQuery({ queryKey: ['me', 'profile'], queryFn: fetchMyProfile, retry: false })

export const usePostingLocations = (draft: Filters) =>
  useQuery({
    queryKey: ['postings', 'locations', toQuery({ ...draft, location: [] })],
    queryFn: () => fetchPostingLocations(draft),
    placeholderData: keepPreviousData,
  })

export const useApplyPosting = (postingId: string, onApplied: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (doc: ApplyDoc | undefined) => applyToPosting(postingId, doc),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['postings'] })
      onApplied()
    },
  })
}

export const useApplyDocs = (enabled: boolean) =>
  useQuery({
    queryKey: ['me', 'sources', 'apply'],
    queryFn: fetchApplyDocs,
    select: (r) => r.data.map(applyDoc),
    enabled,
  })

export const usePosting = (id: string) => useQuery({ queryKey: ['postings', 'detail', id], queryFn: () => fetchPosting(id) })
