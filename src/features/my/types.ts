import type { Application, ApplicationStage, Profile, SourceItem, UserRef } from '@push/api-client'

export type CalendarEventType = 'INTERVIEW' | 'DEADLINE' | 'FOLLOW_UP' | 'COFFEE_CHAT' | 'CUSTOM'

export type CalendarEvent = {
  id: string
  type: CalendarEventType
  title: string
  startsAt: string
  endsAt: string | null
  notes: string
  location?: string | null
  applicationId?: string | null
}

export type FitPartKey = 'techStack' | 'experienceLink' | 'careerLevel' | 'keyword' | 'domain'

/** push-be GET /applications/{id}. `fit` is the stored posting fit of the applied document, absent until one was run. */
export type ApplicationDetail = Application & {
  stageEnteredAt?: Partial<Record<ApplicationStage, string>>
  fit?: {
    fitScore: number
    parts: Record<FitPartKey, number>
    topGap: string
    plan: string
    reachable: number
    documentId: string
    documentTitle: string | null
  }
}

export type ResumeDraft = {
  pageCount: number | null
  email: string | null
  links: string[]
  projects?: string[]
  profile: Pick<
    Profile,
    'displayName' | 'headline' | 'jobCategory' | 'tenureYears' | 'intro' | 'careers' | 'skills'
  >
}

export type MySource = SourceItem & { jobId?: string; status?: string }

export type HubDocument = {
  id: string
  revision: number
  applicationId: string | null
  title: string
  kind: string
  status: string
  latestVersionId: string | null
  updatedAt: string
}

export type DocVersion = {
  id: string
  blocks: { id: string; text: string }[]
  content?: unknown
}

export type HubProfile = {
  headline: string
  intro: string
  careers: { company: string; role: string; startedOn: string | null; endedOn: string | null; description: string }[]
  skills: string[]
}

export type PickedFile = { uri: string; name: string; mimeType?: string | null; size?: number | null }

export type ProfileSection = 'basic' | 'intro' | 'career' | 'skills'

export type ActivitySub = 'applications' | 'calendar' | 'bookmarks' | 'follows' | 'posts'

export type OfferPerson = UserRef & { companyName?: string | null; headline?: string; kind?: 'PERSON' | 'COMPANY' }
