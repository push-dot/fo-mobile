import {
  type DataEnvelope,
  type ListEnvelope,
  type Source,
  type UploadedSource,
} from '@push/api-client'
import { api, http, API_MOCK } from '../../../shared/infrastructure'
import type { CalendarEvent, PickedFile, ResumeDraft } from '../types'

// shortcut: endpoints @push/api-client lacks go through the shared client directly; move them into
// @push/api-client once push-be ships them.
const c = http

// shortcut: push-be has no GET sources list. Real mode shows the profile's resume source plus this session's
// uploads (gone after restart); switch to the list endpoint once push-be ships it.
// Values are the ingest job ids so the list can show 읽는 중 until the server reads the file.
const uploaded = new Map<string, string | undefined>()
const withJob = (s: Source): UploadedSource => ({ ...s, jobId: uploaded.get(s.id) })

export const myApi = {
  sources: async (): Promise<ListEnvelope<UploadedSource>> => {
    if (API_MOCK) {
      const r = await c.get<ListEnvelope<Source>>('sources')
      return { ...r, data: r.data.map(withJob) }
    }
    const { resumeSourceId } = await api.me.profile()
    const ids = [...uploaded.keys()]
    if (resumeSourceId && !uploaded.has(resumeSourceId)) ids.push(resumeSourceId)
    const found = await Promise.all(ids.map((id) => api.sources.get(id).catch(() => null)))
    return { data: found.filter((s): s is Source => !!s).map(withJob), page: { nextCursor: null, hasMore: false } }
  },
  upload: async (file: PickedFile) => {
    const form = new FormData()
    form.append('kind', 'RESUME')
    form.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/pdf', size: file.size ?? 0 } as unknown as Blob)
    const s = await api.sources.upload(form)
    uploaded.set(s.id, s.jobId)
    return s
  },
  remove: async (id: string) => {
    await api.sources.remove(id)
    uploaded.delete(id)
  },
  // shortcut: push-be has no profile-draft parser; real mode returns null and DocViewer shows a placeholder.
  resumeDraft: async (sourceId: string): Promise<ResumeDraft | null> =>
    API_MOCK ? (await c.get<DataEnvelope<ResumeDraft>>(`sources/${sourceId}/profile-draft`)).data : null,
  googleConnected: () =>
    c
      .get<DataEnvelope<{ calendarStatus: string }>>('integrations/google')
      .then((r) => r.data.calendarStatus === 'CONNECTED', () => false),
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
    const endsAt = new Date(Date.parse(body.startsAt) + 3_600_000).toISOString()
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    return (await c.post<DataEnvelope<CalendarEvent>>('calendar/events', { body: { ...body, type, endsAt, timeZone } })).data
  },
}
