import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchSearch } from './fetchers'
import type { SearchTab } from '../utils'

export const useSearch = <T extends SearchTab>(q: string, type: T) =>
  useInfiniteQuery({
    queryKey: ['search', type, q],
    queryFn: ({ pageParam }) => fetchSearch(q, type, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled: q.length > 0,
  })
