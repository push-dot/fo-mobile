import { type JobCategory, type ProfileFilters } from '@push/api-client'
import { api } from '../../../shared/infrastructure'
import { OFFER_BOOKMARKS_LIMIT } from '../constants'
import { profileQuery, type SheetFilters } from '../utils'

export const fetchProfileList = (category: JobCategory[], sheet: SheetFilters, cursor: string | undefined) =>
  api.profiles.list({ ...profileQuery(category, sheet), cursor })

export const fetchProfileCount = (query: ProfileFilters) => api.profiles.list({ ...query, limit: 1 })

export const fetchOfferBookmarks = () => api.me.bookmarks({ limit: OFFER_BOOKMARKS_LIMIT })

export const sendProfileOffer = (userId: string, message: string, postingId: string | undefined) =>
  api.profiles.offer(userId, { message, postingId })

export const fetchProfile = (id: string) => api.profiles.get(id)

export const followProfile = (id: string) => api.profiles.follow(id)

export const unfollowProfile = (id: string) => api.profiles.unfollow(id)
