import { type JobCategory, type ProfileFilters } from '@push/api-client'
import { api } from '../../../shared/infrastructure'
import { OFFER_POSTINGS_LIMIT } from '../constants'
import { profileQuery, type SheetFilters } from '../utils'

export const fetchProfileList = (category: JobCategory[], sheet: SheetFilters, cursor: string | undefined) =>
  api.profiles.list({ ...profileQuery(category, sheet), cursor })

export const fetchProfileCount = (query: ProfileFilters) => api.profiles.list({ ...query, limit: 1 })

/** Only the sender's own company's open postings can ride along: the server refuses any other (profiles/:id/offer), and answers 404 when the sender belongs to no company. */
export const fetchOfferPostings = async () => (await api.postings.mine({ limit: OFFER_POSTINGS_LIMIT })).data.filter((p) => p.status === undefined || p.status === 'OPEN')

export const sendProfileOffer = (userId: string, message: string, postingId: string | undefined) =>
  api.profiles.offer(userId, { message, postingId })

export const fetchProfile = (id: string) => api.profiles.get(id)

export const followProfile = (id: string) => api.profiles.follow(id)

export const unfollowProfile = (id: string) => api.profiles.unfollow(id)
