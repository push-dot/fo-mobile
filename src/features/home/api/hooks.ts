import { useQuery } from '@tanstack/react-query'
import type { SectionKind } from '@/features/jobs'
import { fetchHomePostings } from './fetchers'

export const useHomePostings = (kind: SectionKind) =>
  useQuery({ queryKey: ['postings', 'home', kind], queryFn: () => fetchHomePostings(kind) })
