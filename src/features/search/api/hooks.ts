import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../../../shared/infrastructure'
import { SEARCH_PAGE_LIMIT } from '../constants'
import type { SearchTab } from '../utility'

export const useSearch = <T extends SearchTab>(q: string, type: T) =>
  useInfiniteQuery({
    queryKey: ['search', type, q],
    queryFn: ({ pageParam }) => api.search(q, type, { limit: SEARCH_PAGE_LIMIT, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled: q.length > 0,
  })
