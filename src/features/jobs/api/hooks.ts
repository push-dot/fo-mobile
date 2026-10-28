import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Posting, PostingFilters } from '@push/api-client'
import { api } from '../../../shared/infrastructure'
import { APPLY_DOC_LIMIT, POSTING_PAGE_LIMIT } from '../constants'
import type { ApplyDoc } from '../types'
import { applyDoc, toQuery, type Filters } from '../utility'

export const usePostingPages = (f: PostingFilters) =>
  useInfiniteQuery({
    queryKey: ['postings', 'list', f],
    queryFn: ({ pageParam }) => api.postings.list({ ...f, limit: POSTING_PAGE_LIMIT, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

export const useToggleBookmark = () => {
  const qc = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: (p: Posting) => (p.bookmarked ? api.postings.unbookmark(p.id) : api.postings.bookmark(p.id)),
    onSettled: () => Promise.all(['postings', 'search', 'bookmarks'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  })
  return mutate
}

export const useGridTotal = (filters: PostingFilters) => usePostingPages(filters).data?.pages[0]?.page.total

export const usePostingCount = (draft: Filters) =>
  useQuery({
    queryKey: ['postings', 'count', toQuery(draft)],
    queryFn: () => api.postings.list({ ...toQuery(draft), limit: 1 }),
    placeholderData: keepPreviousData,
  })

export const useProfile = () => useQuery({ queryKey: ['me', 'profile'], queryFn: api.me.profile, retry: false })

export const usePostingLocations = (draft: Filters) =>
  useQuery({
    queryKey: ['postings', 'locations', toQuery({ ...draft, location: [] })],
    queryFn: () => api.postings.locations(toQuery({ ...draft, location: [] })),
    placeholderData: keepPreviousData,
  })

export const useApplyPosting = (postingId: string, onApplied: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (doc: ApplyDoc | undefined) =>
      api.postings.apply(postingId, doc?.ai ? [doc.id] : [], doc && !doc.ai ? [doc.id] : []),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['postings'] })
      onApplied()
    },
  })
}

export const useApplyDocs = (enabled: boolean) =>
  useQuery({
    queryKey: ['me', 'sources', 'apply'],
    queryFn: () => api.sources.list({ limit: APPLY_DOC_LIMIT }),
    select: (r) => r.data.map(applyDoc),
    enabled,
  })

export const usePosting = (id: string) => useQuery({ queryKey: ['postings', 'detail', id], queryFn: () => api.postings.get(id) })
