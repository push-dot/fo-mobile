import type { Posting, PostingFilters } from '@push/api-client'
import { api } from '../../../shared/infrastructure'
import { APPLY_DOC_LIMIT, POSTING_PAGE_LIMIT } from '../constants'
import type { ApplyBody } from '../types'
import { toQuery, type Filters } from '../utils'

export const fetchPostingPages = (f: PostingFilters, cursor: string | undefined) =>
  api.postings.list({ ...f, limit: POSTING_PAGE_LIMIT, cursor })

export const togglePostingBookmark = (p: Posting) => (p.bookmarked ? api.postings.unbookmark(p.id) : api.postings.bookmark(p.id))

export const fetchPostingCount = (draft: Filters) => api.postings.list({ ...toQuery(draft), limit: 1 })

export const fetchMyProfile = api.me.profile

export const fetchPostingLocations = (draft: Filters) => api.postings.locations(toQuery({ ...draft, location: [] }))

export const applyToPosting = (postingId: string, body: ApplyBody) => api.postings.apply(postingId, body.documentIds, body.sourceIds)

export const fetchApplyDocs = () => api.sources.list({ limit: APPLY_DOC_LIMIT })

export const fetchPosting = (id: string) => api.postings.get(id)

export const fetchContact = () => api.me.contact()

export const sendContactPhoneCode = (phone: string) => api.auth.phoneSend(phone)

export const verifyContactPhone = (body: { phone: string; code: string; moveDocuments?: boolean }) => api.me.verifyContactPhone(body)

export const sendContactEmailCode = (email: string) => api.me.sendContactEmail(email)

export const verifyContactEmail = (email: string, code: string) => api.me.verifyContactEmail(email, code)
