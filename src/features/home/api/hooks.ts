import { useQuery } from '@tanstack/react-query'
import { api } from '../../../shared/infrastructure'
import type { SectionKind } from '@/features/jobs'
import { HOME_POSTING_LIMIT } from '../constants'

export const useHomePostings = (kind: SectionKind) =>
  useQuery({ queryKey: ['postings', 'home', kind], queryFn: () => api.postings.list({ sort: kind, limit: HOME_POSTING_LIMIT }) })

export const useHomeSections = (): SectionKind[] => ['latest', 'deadline', 'popular']
