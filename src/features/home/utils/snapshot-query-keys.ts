import type { QueryClient } from '@tanstack/react-query'
import { HOME_POSTINGS_KEY, homePostingsQuery } from '../api/hooks'
import { HOME_SECTION_KINDS } from './snapshot-dto'

export const NOTIFICATIONS_KEY = ['notifications'] as const

export const isHomeQueryKey = (key: readonly unknown[]) =>
  (key[0] === HOME_POSTINGS_KEY[0] && key[1] === HOME_POSTINGS_KEY[1]) || key[0] === NOTIFICATIONS_KEY[0]

export const removeHomeQueries = (qc: QueryClient) => {
  for (const kind of HOME_SECTION_KINDS) {
    qc.removeQueries({ queryKey: homePostingsQuery(kind).queryKey })
  }
  qc.removeQueries({ queryKey: NOTIFICATIONS_KEY })
}
