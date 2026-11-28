import { keepPreviousData, queryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PostingDetail, PostingFilters } from '@push/api-client'
import { queryClient } from '@/providers/query-client'
import { applyDoc, toQuery, type Filters } from '../utils'
import type { ApplyBody } from '../types'
import { patchPostingBookmark } from '../utils/bookmark-invalidation'
import { applyToPosting, fetchApplyDocs, fetchContact, fetchMyProfile, fetchPosting, fetchPostingCount, fetchPostingLocations, fetchPostingPages, togglePostingBookmark } from './fetchers'

export const usePostingPages = (f: PostingFilters) =>
  useInfiniteQuery({
    queryKey: ['postings', 'list', f],
    queryFn: ({ pageParam }) => fetchPostingPages(f, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

const BOOKMARK_KEYS = [['postings'], ['search', 'postings'], ['me', 'bookmarks']] as const

export const useToggleBookmark = () => {
  const qc = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: togglePostingBookmark,
    onMutate: async (p) => {
      const interrupted = BOOKMARK_KEYS.flatMap((queryKey) => qc.getQueryCache().findAll({ queryKey, fetchStatus: 'fetching' })).map((q) => q.queryKey)
      await Promise.all(BOOKMARK_KEYS.map((queryKey) => qc.cancelQueries({ queryKey })))
      const before = BOOKMARK_KEYS.flatMap((queryKey) => qc.getQueriesData({ queryKey })).filter(([, old]) => patchPostingBookmark(old, p.id, !p.bookmarked) !== old)
      for (const [key, old] of before) qc.setQueryData(key, patchPostingBookmark(old, p.id, !p.bookmarked))
      return { before, interrupted }
    },
    onError: (_e, _p, ctx) => {
      ctx?.before.forEach(([key, data]) => qc.setQueryData(key, data))
      void qc.invalidateQueries({ queryKey: ['postings'] })
      void qc.invalidateQueries({ queryKey: ['search', 'postings'] })
    },
    onSettled: (_d, _e, _p, ctx) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['me', 'bookmarks'] }),
        qc.invalidateQueries({ queryKey: ['calendar'] }),
        ...(ctx?.interrupted ?? []).map((queryKey) => qc.invalidateQueries({ queryKey, exact: true })),
      ]),
  })
  return mutate
}

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
    mutationFn: (body: ApplyBody) => applyToPosting(postingId, body),
    onSuccess: () => {
      qc.setQueryData(['postings', 'detail', postingId], (p: PostingDetail | undefined) => (p ? { ...p, applied: true } : p))
      void qc.invalidateQueries({ queryKey: ['postings'] })
      void qc.invalidateQueries({ queryKey: ['calendar'] })
      onApplied()
    },
  })
}

export const useApplyDocs = (enabled: boolean) =>
  useQuery({
    queryKey: ['me', 'sources', 'apply'],
    queryFn: fetchApplyDocs,
    select: (r) => r.data.map((item) => applyDoc(item)),
    enabled,
  })

export const postingDetailQuery = (id: string) => queryOptions({ queryKey: ['postings', 'detail', id], queryFn: () => fetchPosting(id) })

export const prefetchPosting = (id: string) => void queryClient.prefetchQuery(postingDetailQuery(id))

export const usePosting = (id: string) => useQuery({ ...postingDetailQuery(id), enabled: id.length > 0 })

export const CONTACT_KEY = ['me', 'contact'] as const

export const useContact = () => useQuery({ queryKey: CONTACT_KEY, queryFn: fetchContact })
