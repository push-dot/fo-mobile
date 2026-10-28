import { jobQuery, type DataEnvelope, type ListEnvelope, type Posting } from '@push/api-client'
import { api, deleteAccount, http, API_MOCK, signOut } from '../../../shared/infrastructure'
import type { CalendarEvent, MySource, PickedFile, ResumeDraft } from '../types'
import { toResumeDraft } from '../utils'

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

const FIRST = { limit: 50 }

export const ingestJobQuery = (jobId: string | undefined) => jobQuery(api.jobs, jobId)

export const fetchUnreadOffers = () => api.me.offers('received', { limit: 50 })

export const fetchOffers = (box: 'received' | 'sent') => api.me.offers(box, { limit: 50 })

export const fetchMyProfile = api.me.profile

export const fetchAuthMe = api.auth.me

export const fetchSettings = api.me.settings

export const updateSettings = api.me.updateSettings

export const fetchBookmarkList = () => api.me.bookmarks({ limit: 100 })

export const fetchLinks = () => api.me.links(undefined, { limit: 100 })

export const deleteLink = api.me.deleteLink

export const addLink = api.me.addLink

export const fetchMyApplications = () => api.applications.list(FIRST)

export const fetchMyBookmarks = () => api.me.bookmarks(FIRST)

export const unbookmarkPosting = (p: Posting) => api.postings.unbookmark(p.id)

export const followProfile = (id: string) => api.profiles.follow(id)

export const unfollowProfile = (id: string) => api.profiles.unfollow(id)

export const fetchFollows = () => api.me.follows(FIRST)

export const fetchFollowers = () => api.me.followers(FIRST)

export const fetchMyPosts = () => api.me.posts(FIRST)

export const fetchCommentedPosts = () => api.me.commentedPosts(FIRST)

export const fetchSource = (id: string) => api.sources.get(id)

export const updateProfile = api.me.updateProfile

export const fetchOffer = (id: string) => api.me.offer(id)

export const acceptOffer = (id: string, reply: string | undefined) => api.me.acceptOffer(id, reply)

export const declineOffer = (id: string) => api.me.declineOffer(id)

export const fetchPosting = (id: string) => api.postings.get(id)

export const fetchOfferMessages = (offerId: string) => api.me.offerMessages(offerId, { limit: 100 })

export const sendOfferMessage = (offerId: string, body: string) => api.me.sendOfferMessage(offerId, body)

export const uploadAvatarImage = async (file: { uri: string; fileName?: string | null; mimeType?: string | null }) => {
  const form = new FormData()
  form.append('file', {
    uri: file.uri,
    name: file.fileName ?? 'avatar.jpg',
    type: file.mimeType ?? 'image/jpeg',
  } as unknown as Blob)
  return api.uploads.image(form)
}

export const signOutSession = () => signOut()

export const deleteAccountSession = () => deleteAccount()
