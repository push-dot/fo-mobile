import type { Posting } from '@push/api-client'
import type { SectionKind } from '@/features/jobs'

export type HomePostingCard = Pick<
  Posting,
  'id' | 'company' | 'title' | 'imageUrl' | 'location' | 'careerMin' | 'careerMax' | 'bookmarked'
>

export type HomeSnapshotSections = Record<SectionKind, HomePostingCard[]>

export type HomeSnapshot = {
  version: number
  savedAt: number
  sections: HomeSnapshotSections
  unreadCount: number
}
