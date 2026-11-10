import type { QueryClient } from '@tanstack/react-query'
import type { SectionKind } from '@/features/jobs'

export const HOME_SECTION_KINDS = ['latest', 'deadline', 'popular'] as const satisfies readonly SectionKind[]

export const isHomeQueryKey = (key: readonly unknown[]) =>
  (key[0] === 'postings' && key[1] === 'home') || key[0] === 'notifications'

export const removeHomeQueries = (qc: QueryClient) => {
  for (const kind of HOME_SECTION_KINDS) {
    qc.removeQueries({ queryKey: ['postings', 'home', kind] })
  }
  qc.removeQueries({ queryKey: ['notifications'] })
}
