import type { QueryClient } from '@tanstack/react-query'
import type { SectionKind } from '@/features/jobs'
import { expandHomeSnapshot, shrinkHomeSnapshotPayload } from './snapshot-dto'
import { HOME_SECTION_KINDS } from './snapshot-query-keys'
import type { HomeSnapshot } from '../types'

export const HYDRATED_QUERY_UPDATED_AT = 0

export const hydrateHomeQueries = (qc: QueryClient, snapshot: HomeSnapshot) => {
  const { sections } = expandHomeSnapshot(snapshot)
  for (const kind of HOME_SECTION_KINDS) {
    qc.setQueryData(['postings', 'home', kind as SectionKind], sections[kind as SectionKind], {
      updatedAt: HYDRATED_QUERY_UPDATED_AT,
    })
  }
  void qc.invalidateQueries({ queryKey: ['postings', 'home'] })
}

export const collectHomeSnapshotPayload = (qc: QueryClient, savedAt = Date.now()) => {
  const sections = {} as Parameters<typeof shrinkHomeSnapshotPayload>[0]
  for (const kind of HOME_SECTION_KINDS) {
    if (qc.getQueryState(['postings', 'home', kind])?.dataUpdatedAt === HYDRATED_QUERY_UPDATED_AT) return null
    const data = qc.getQueryData<Parameters<typeof shrinkHomeSnapshotPayload>[0][typeof kind]>(['postings', 'home', kind])
    if (!data) return null
    sections[kind] = data
  }
  const notifications = qc.getQueryData<Parameters<typeof shrinkHomeSnapshotPayload>[1]>(['notifications'])
  if (!notifications) return null
  return shrinkHomeSnapshotPayload(sections, notifications, savedAt)
}
