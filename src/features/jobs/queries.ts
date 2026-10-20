import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Posting, PostingFilters } from '@push/api-client'
import { api } from '../../lib/api'

/** Cursor-paged postings for the 2-column grids (채용공고, 섹션 전체보기). */
export const usePostingPages = (f: PostingFilters) =>
  useInfiniteQuery({
    queryKey: ['postings', 'list', f],
    queryFn: ({ pageParam }) => api.postings.list({ ...f, limit: 20, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

/** Toggles a bookmark and refreshes every postings list (home rows, grids, search, 마이 북마크). */
export const useToggleBookmark = () => {
  const qc = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: (p: Posting) => (p.bookmarked ? api.postings.unbookmark(p.id) : api.postings.bookmark(p.id)),
    onSettled: () => Promise.all(['postings', 'search', 'bookmarks'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  })
  return mutate
}
