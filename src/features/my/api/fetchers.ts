import { atDocumentRevision, jobQuery, type DataEnvelope, type ListEnvelope, type MyPostsSort, type Posting } from '@push/api-client'
import { api, deleteAccount, http, API_MOCK, signOut } from '../../../shared/infrastructure'
import { sourcesApi } from '../../../shared/infrastructure/sources'
import type { ApplicationDetail, CalendarEvent, DocVersion, HubDocument, MySource, ResumeDraft } from '../types'
import { copyBody, copyVersionBody, profileConvertBody, setBaseProfilePath, toResumeDraft } from '../utils'

const c = http

export const myApi = {
  renameSource: (id: string, fileName: string) => c.patch<DataEnvelope<MySource>>(`sources/${id}`, { body: { fileName } }),
  sources: sourcesApi.list,
  upload: sourcesApi.upload,
  remove: sourcesApi.remove,
  archive: (id: string) => atDocumentRevision(api.documents, id, (revision) => api.documents.archive(id, revision)),
  restore: (id: string) => atDocumentRevision(api.documents, id, (revision) => api.documents.restore(id, revision)),
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

export const fetchArchivedOffers = (box: 'received' | 'sent') => api.me.offers(box, { limit: 50, archived: 1 })

export const fetchMyProfile = api.me.profile

export const fetchAuthMe = api.auth.me

export const fetchSettings = api.me.settings

export const fetchConsents = () => api.me.consents()

export const updateReferenceConsent = (referenceData: boolean) => api.me.updateConsents(referenceData)

export const updateMarketingConsent = (marketing: boolean) => api.me.updateMarketing(marketing)

export const updateSettings = api.me.updateSettings

export const grantReferenceAccess = async () => {
  const consents = await updateReferenceConsent(true)
  await updateSettings({ allowAiReadMyFiles: true })
  return consents
}

export const fetchBookmarkList = () => api.me.bookmarks({ limit: 100 })

export const fetchLinks = () => api.me.links(undefined, { limit: 100 })

export const deleteLink = api.me.deleteLink

export const restoreLink = api.me.restoreLink

export const addLink = api.me.addLink

export const fetchMyApplications = () => api.applications.list(FIRST)

export const fetchAppliedApplications = () => api.applications.list({ ...FIRST, applied: true })

export const fetchApplication = async (id: string) => (await c.get<DataEnvelope<ApplicationDetail>>(`applications/${id}`)).data

export const fetchMyBookmarks = () => api.me.bookmarks(FIRST)

export const unbookmarkPosting = (p: Posting) => api.postings.unbookmark(p.id)

export const followProfile = (id: string) => api.profiles.follow(id)

export const unfollowProfile = (id: string) => api.profiles.unfollow(id)

export const fetchFollows = () => api.me.follows(FIRST)

export const fetchFollowers = () => api.me.followers(FIRST)

export const fetchMyPosts = (sort: MyPostsSort = 'latest') => api.me.posts({ ...FIRST, sort })

export const fetchCommentedPosts = (sort: MyPostsSort = 'latest') => api.me.commentedPosts({ ...FIRST, sort })

export const fetchSavedPosts = (sort: MyPostsSort = 'latest') => api.me.savedPosts({ ...FIRST, sort })

export const fetchSource = (id: string) => api.sources.get(id)

export const updateProfile = api.me.updateProfile

export const fetchProfileChange = api.me.profileChange

export const undoProfileChange = api.me.undoProfileChange

export const fetchOffer = (id: string) => api.me.offer(id)

export const acceptOffer = (id: string, reply: string | undefined) => api.me.acceptOffer(id, reply)

export const declineOffer = (id: string) => api.me.declineOffer(id)

export const archiveOffer = (id: string) => api.me.archiveOffer(id)

export const unarchiveOffer = (id: string) => api.me.unarchiveOffer(id)

export const reportOffer = (id: string, reason?: string) => api.me.reportOffer(id, reason)

export const blockUser = (userId: string) => api.me.blockUser(userId)

export const fetchBlocked = () => api.me.blocks({ limit: 100 })

export const unblockUser = (userId: string) => api.me.unblockUser(userId)

export const fetchPosting = (id: string) => api.postings.get(id)

export const fetchEvents = (from: string, to: string) =>
  c.get<ListEnvelope<CalendarEvent>>('calendar/events', { query: { from, to, limit: 100 } })

export const fetchOfferMessages = (offerId: string) => api.me.offerMessages(offerId, { limit: 100 })

export const sendOfferMessage = (offerId: string, body: string) => api.me.sendOfferMessage(offerId, body)

export const fetchDocuments = async () => {
  const r = await c.get<ListEnvelope<HubDocument>>('documents', { query: { limit: 50 } })
  return { ...r, data: r.data.filter((d) => d.status !== 'ARCHIVED') }
}

export const fetchDocument = (id: string) => c.get<DataEnvelope<HubDocument>>(`documents/${id}`)

export const renameDocument = (id: string, expectedRevision: number, title: string) =>
  atDocumentRevision(api.documents, id, (revision) => api.documents.rename(id, revision, title), expectedRevision)

export const archiveDocument = (id: string, expectedRevision: number) =>
  atDocumentRevision(api.documents, id, (revision) => api.documents.archive(id, revision), expectedRevision)

export const fetchDocumentVersions = (id: string) =>
  c.get<ListEnvelope<DocVersion>>(`documents/${id}/versions`, { query: { limit: 1 } })

export const duplicateDocument = async (id: string) => {
  const source = (await fetchDocument(id)).data
  const version = (await fetchDocumentVersions(id)).data[0]
  const made = (await c.post<DataEnvelope<HubDocument>>('documents', { body: copyBody(source) })).data
  if (!version?.content) return made
  try {
    await c.post(`documents/${made.id}/versions`, { body: copyVersionBody(made.revision, version) })
  } catch (error) {
    await archiveDocument(made.id, made.revision).catch(() => undefined)
    throw error
  }
  return made
}

export const convertDocumentProfile = async (id: string) =>
  (await c.post<DataEnvelope<{ documentId: string; jobId?: string }>>(`documents/${id}/profile`, { body: profileConvertBody() })).data

export const setDocumentBaseProfile = async (id: string) =>
  (await c.post<DataEnvelope<{ documentId: string }>>(setBaseProfilePath(id), { body: {} })).data

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
