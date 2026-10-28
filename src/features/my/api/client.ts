import { type DataEnvelope, type ListEnvelope } from '@push/api-client'
import { api, http, API_MOCK } from '../../../shared/infrastructure'
import type { CalendarEvent, MySource, PickedFile, ResumeDraft } from '../types'
import { toResumeDraft } from '../utility'

const c = http

// Values are this session's ingest job ids so the list can show 읽는 중 until the server reads the file.
const uploaded = new Map<string, string | undefined>()

export const myApi = {
  // shortcut: first 100 uploads only; page once the docs tab loads more on scroll.
  sources: async (): Promise<ListEnvelope<MySource>> => {
    const r = await api.sources.list({ kind: 'UPLOAD', limit: 100 })
    return { ...r, data: r.data.map((s) => ({ ...s, jobId: uploaded.get(s.id) })) }
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
  resumeDraft: async (sourceId: string): Promise<ResumeDraft> =>
    API_MOCK
      ? (await c.get<DataEnvelope<ResumeDraft>>(`sources/${sourceId}/profile-draft`)).data
      : toResumeDraft(await api.sources.profileDraft(sourceId)),
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
    const endsAt = new Date(Date.parse(body.startsAt) + 3_600_000).toISOString()
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    return (await c.post<DataEnvelope<CalendarEvent>>('calendar/events', { body: { ...body, endsAt, timeZone } })).data
  },
}
