import type { Posting, PostingFilters } from '@push/api-client'
import { api } from '../../../shared/infrastructure'
import { APPLY_DOC_LIMIT, POSTING_PAGE_LIMIT } from '../constants'
import type { ApplyDoc } from '../types'
import { toQuery, type Filters } from '../utils'

export const fetchPostingPages = (f: PostingFilters, cursor: string | undefined) =>
  api.postings.list({ ...f, limit: POSTING_PAGE_LIMIT, cursor })

export const togglePostingBookmark = (p: Posting) => (p.bookmarked ? api.postings.unbookmark(p.id) : api.postings.bookmark(p.id))

export const fetchPostingCount = (draft: Filters) => api.postings.list({ ...toQuery(draft), limit: 1 })

export const fetchMyProfile = api.me.profile

export const fetchPostingLocations = (draft: Filters) => api.postings.locations(toQuery({ ...draft, location: [] }))

export const applyToPosting = (postingId: string, doc: ApplyDoc | undefined) =>
  api.postings.apply(postingId, doc?.ai ? [doc.id] : [], doc && !doc.ai ? [doc.id] : [])

export const fetchApplyDocs = () => api.sources.list({ limit: APPLY_DOC_LIMIT })

export const fetchPosting = (id: string) => api.postings.get(id)
