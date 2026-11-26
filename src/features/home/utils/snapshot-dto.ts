import type { AppNotification, ListEnvelope, Posting } from '@push/api-client'
import type { SectionKind } from '@/features/jobs'
import type { HomePostingCard, HomeSnapshot, HomeSnapshotSections } from '../types'

const HOME_KINDS: SectionKind[] = ['latest', 'deadline', 'popular']

const postingPad = (card: HomePostingCard): Posting => ({
  ...card,
  jobCategory: 'dev',
  skills: [],
  employmentType: 'full_time',
  deadline: null,
  applied: false,
  sourceUrl: null,
  createdAt: '',
})

export const toPostingCard = (p: Posting): HomePostingCard => ({
  id: p.id,
  company: p.company,
  title: p.title,
  imageUrl: p.imageUrl,
  location: p.location,
  careerMin: p.careerMin,
  careerMax: p.careerMax,
  bookmarked: p.bookmarked,
})

const toSectionEnvelope = (cards: HomePostingCard[]): ListEnvelope<Posting> => ({
  data: cards.map(postingPad),
  page: { nextCursor: null, hasMore: false },
})

export const countUnread = (raw: ListEnvelope<AppNotification> | undefined) => raw?.data.filter((n) => !n.readAt).length ?? 0

export const expandHomeSnapshot = (snapshot: HomeSnapshot) => ({
  sections: Object.fromEntries(HOME_KINDS.map((k) => [k, toSectionEnvelope(snapshot.sections[k])])) as Record<
    SectionKind,
    ListEnvelope<Posting>
  >,
})

export const shrinkHomeSnapshotPayload = (
  sections: Record<SectionKind, ListEnvelope<Posting>>,
  notifications: ListEnvelope<AppNotification>,
  savedAt: number,
): Omit<HomeSnapshot, 'version'> => {
  const trimmed = {} as HomeSnapshotSections
  for (const kind of HOME_KINDS) {
    trimmed[kind] = sections[kind].data.map(toPostingCard)
  }
  return {
    sections: trimmed,
    unreadCount: countUnread(notifications),
    savedAt,
  }
}
