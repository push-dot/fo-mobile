import type { QueryClient } from '@tanstack/react-query'
import type { AppNotification, ListEnvelope, Posting } from '@push/api-client'
import type { SectionKind } from '@/features/jobs'
import { HOME_POSTINGS_KEY, homePostingsQuery } from '../api/hooks'
import { expandHomeSnapshot, HOME_SECTION_KINDS, shrinkHomeSnapshotPayload } from './snapshot-dto'
import { NOTIFICATIONS_KEY } from './snapshot-query-keys'
import type { HomeSnapshot } from '../types'

export const HYDRATED_QUERY_UPDATED_AT = 0

export const hydrateHomeQueries = (qc: QueryClient, snapshot: HomeSnapshot) => {
  const { sections } = expandHomeSnapshot(snapshot)
  for (const kind of HOME_SECTION_KINDS) {
    qc.setQueryData(homePostingsQuery(kind).queryKey, sections[kind], { updatedAt: HYDRATED_QUERY_UPDATED_AT })
  }
  void qc.invalidateQueries({ queryKey: HOME_POSTINGS_KEY })
}

export const collectHomeSnapshotPayload = (qc: QueryClient, savedAt = Date.now()) => {
  const sections = {} as Record<SectionKind, ListEnvelope<Posting>>
  for (const kind of HOME_SECTION_KINDS) {
    const { queryKey } = homePostingsQuery(kind)
    if (qc.getQueryState(queryKey)?.dataUpdatedAt === HYDRATED_QUERY_UPDATED_AT) return null
    const data = qc.getQueryData(queryKey)
    if (!data) return null
    sections[kind] = data
  }
  const notifications = qc.getQueryData<ListEnvelope<AppNotification>>(NOTIFICATIONS_KEY)
  if (!notifications) return null
  return shrinkHomeSnapshotPayload(sections, notifications, savedAt)
}
