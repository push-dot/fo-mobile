import { queryOptions, useQuery } from '@tanstack/react-query'
import type { SectionKind } from '@/features/jobs'
import { fetchHomePostings } from './fetchers'

export const HOME_POSTINGS_KEY = ['postings', 'home'] as const

export const homePostingsQuery = (kind: SectionKind) =>
  queryOptions({ queryKey: [...HOME_POSTINGS_KEY, kind], queryFn: () => fetchHomePostings(kind) })

export const useHomePostings = (kind: SectionKind) => useQuery(homePostingsQuery(kind))
