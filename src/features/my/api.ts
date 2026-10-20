import {
  type DataEnvelope,
  type ListEnvelope,
  type Profile,
  type Source,
} from '@push/api-client'
import { api, http } from '../../lib/api'
import { API_MOCK } from '../../lib/config'

export type CalendarEventType = 'INTERVIEW' | 'DEADLINE' | 'FOLLOW_UP' | 'COFFEE_CHAT' | 'CUSTOM'
/** The push-be calendar event fields the app reads. COFFEE_CHAT exists only in mock data (see addEvent). */
export type CalendarEvent = {
  id: string
  type: CalendarEventType
  title: string
  startsAt: string
  endsAt: string | null
  notes: string
}

/** What the server read out of an uploaded 서류 (DocViewer preview + 내 프로필로 전환). */
export type ResumeDraft = {
  pageCount: number
  email: string | null
  links: string[]
  profile: Pick<
    Profile,
    'displayName' | 'headline' | 'jobCategory' | 'tenureYears' | 'intro' | 'careers' | 'skills'
  >
}

export type PickedFile = { uri: string; name: string; mimeType?: string | null; size?: number | null }

// shortcut: endpoints @push/api-client lacks go through the shared client directly; move them into
// @push/api-client once push-be ships them.
const c = http

// shortcut: push-be has no GET sources list. Real mode shows the profile's resume source plus this session's
// uploads (gone after restart); switch to the list endpoint once push-be ships it.
const uploaded = new Set<string>()

export const myApi = {
  sources: async (): Promise<ListEnvelope<Source>> => {
    if (API_MOCK) return c.get<ListEnvelope<Source>>('sources')
    const { resumeSourceId } = await api.me.profile()
    const ids = [...uploaded]
    if (resumeSourceId && !uploaded.has(resumeSourceId)) ids.push(resumeSourceId)
    // A source deleted elsewhere 404s; leave it out instead of failing the list.
    const found = await Promise.all(ids.map((id) => api.sources.get(id).catch(() => null)))
    return { data: found.filter((s): s is Source => !!s), page: { nextCursor: null, hasMore: false } }
  },
  upload: async (file: PickedFile) => {
    const form = new FormData()
    // push-be requires `kind`; it is stored as-is.
    form.append('kind', 'RESUME')
    // React Native FormData takes a { uri, name, type } file descriptor.
    form.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/pdf', size: file.size ?? 0 } as unknown as Blob)
    const s = await api.sources.upload(form)
    uploaded.add(s.id)
    return s
  },
  remove: async (id: string) => {
    await api.sources.remove(id)
    uploaded.delete(id)
  },
  // shortcut: push-be has no profile-draft parser; real mode returns null and DocViewer shows a placeholder.
  resumeDraft: async (sourceId: string): Promise<ResumeDraft | null> =>
    API_MOCK ? (await c.get<DataEnvelope<ResumeDraft>>(`sources/${sourceId}/profile-draft`)).data : null,
  /** Google Calendar link state; false when the integration call fails. */
  googleConnected: () =>
    c
      .get<DataEnvelope<{ calendarStatus: string }>>('integrations/google')
      .then((r) => r.data.calendarStatus === 'CONNECTED', () => false),
  /** Month of events (push-be caps a page at 100) plus the Google Calendar link state. */
  calendar: async (from: string, to: string) => {
    const [events, connected] = await Promise.all([
      c.get<ListEnvelope<CalendarEvent>>('calendar/events', { query: { from, to, limit: 100 } }),
      myApi.googleConnected(),
    ])
    return { data: events.data, google: { connected } }
  },
  addEvent: async (body: Pick<CalendarEvent, 'type' | 'title' | 'startsAt'>) => {
    // shortcut: push-be has no COFFEE_CHAT type, so it is saved as CUSTOM (직접 추가 after reload) until push-be adds it.
    const type = body.type === 'COFFEE_CHAT' ? 'CUSTOM' : body.type
    // push-be requires endsAt after startsAt; the sheet only picks a start, so it books an hour.
    const endsAt = new Date(Date.parse(body.startsAt) + 3_600_000).toISOString()
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    return (await c.post<DataEnvelope<CalendarEvent>>('calendar/events', { body: { ...body, type, endsAt, timeZone } })).data
  },
}
