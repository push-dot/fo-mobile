import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { TRENDING_STALE_MS } from '../constants'
import { fetchSearch, fetchTrending } from './fetchers'
import type { SearchSort } from '../types'
import type { SearchTab } from '../utils'
import { searchEnabled } from './search-enabled'

export const useSearch = <T extends SearchTab>(q: string, type: T, sort: SearchSort, active = true) =>
  useInfiniteQuery({
    queryKey: ['search', type, q, sort],
    queryFn: ({ pageParam }) => fetchSearch(q, type, pageParam, sort),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled: searchEnabled(q, active),
    // keeps the tab counts on screen while the next query loads (the HomeLoading search board draws them)
    placeholderData: keepPreviousData,
  })

export const useTrending = () => useQuery({ queryKey: ['search', 'trending'], queryFn: fetchTrending, staleTime: TRENDING_STALE_MS })
