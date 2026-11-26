import type { SkeletonRowsShape } from '../../shared/components'

export { CAREER_STATUSES, HUB_CATEGORIES } from '@push/api-client'

export const PROPOSAL_MAX = 500

export const OFFER_POSTINGS_LIMIT = 10

export const HUB_SKELETON: SkeletonRowsShape = {
  count: 5,
  lead: { size: 52, radius: 26 },
  lines: [
    { width: '40%', height: 12 },
    { width: '85%', height: 16 },
    { width: '60%', height: 12 },
  ],
}
