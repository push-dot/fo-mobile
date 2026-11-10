import type { QueryClient } from '@tanstack/react-query'
import type { SectionKind } from '@/features/jobs'
import { expandHomeSnapshot, shrinkHomeSnapshotPayload } from './dto'
import { HOME_SECTION_KINDS } from './query-keys'
import type { HomeSnapshot } from './types'

/** Force background refetch: hydrated rows are immediately stale. */
export const HYDRATED_QUERY_UPDATED_AT = 0

export const hydrateHomeQueries = (qc: QueryClient, snapshot: HomeSnapshot) => {
  const { sections, notifications } = expandHomeSnapshot(snapshot)
  for (const kind of HOME_SECTION_KINDS) {
    qc.setQueryData(['postings', 'home', kind as SectionKind], sections[kind as SectionKind], {
      updatedAt: HYDRATED_QUERY_UPDATED_AT,
    })
  }
  qc.setQueryData(['notifications'], notifications, { updatedAt: HYDRATED_QUERY_UPDATED_AT })
  void qc.invalidateQueries({ queryKey: ['postings', 'home'] })
  void qc.invalidateQueries({ queryKey: ['notifications'] })
}

export const collectHomeSnapshotPayload = (qc: QueryClient, savedAt = Date.now()) => {
  const sections = {} as Parameters<typeof shrinkHomeSnapshotPayload>[0]
  for (const kind of HOME_SECTION_KINDS) {
    const data = qc.getQueryData<Parameters<typeof shrinkHomeSnapshotPayload>[0][typeof kind]>(['postings', 'home', kind])
    if (!data) return null
    sections[kind] = data
  }
  const notifications = qc.getQueryData<Parameters<typeof shrinkHomeSnapshotPayload>[1]>(['notifications'])
  if (!notifications) return null
  return shrinkHomeSnapshotPayload(sections, notifications, savedAt)
}
