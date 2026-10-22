import { useQuery } from '@tanstack/react-query'
import { api, API_MOCK } from '../../../shared/infrastructure'
import type { SectionKind } from '@/features/jobs'
import { HOME_POSTING_LIMIT } from '../constants'

export const useHomePostings = (kind: SectionKind) =>
  useQuery({ queryKey: ['postings', 'home', kind], queryFn: () => api.postings.list({ sort: kind, limit: HOME_POSTING_LIMIT }) })

// shortcut: push-be ignores ?sort (always newest), so 마감 임박 / 많이 본 would repeat 새로 올라온; shown in mock only
// until push-be sorts by deadline and views.
export const useHomeSections = (): SectionKind[] => (API_MOCK ? ['latest', 'deadline', 'popular'] : ['latest'])
