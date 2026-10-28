import type { Profile, SourceItem, UserRef } from '@push/api-client'

export type CalendarEventType = 'INTERVIEW' | 'DEADLINE' | 'FOLLOW_UP' | 'COFFEE_CHAT' | 'CUSTOM'

export type CalendarEvent = {
  id: string
  type: CalendarEventType
  title: string
  startsAt: string
  endsAt: string | null
  notes: string
}

export type ResumeDraft = {
  pageCount: number | null
  email: string | null
  links: string[]
  profile: Pick<
    Profile,
    'displayName' | 'headline' | 'jobCategory' | 'tenureYears' | 'intro' | 'careers' | 'skills'
  >
}

export type MySource = SourceItem & { jobId?: string }

export type PickedFile = { uri: string; name: string; mimeType?: string | null; size?: number | null }

export type ProfileSection = 'basic' | 'intro' | 'career' | 'skills'

export type ActivitySub = 'applications' | 'calendar' | 'bookmarks' | 'follows' | 'posts'

export type OfferPerson = UserRef & { companyName?: string | null }
