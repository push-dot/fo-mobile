import type { CareerStatus } from '@push/api-client'
import type { BadgeTone, SkeletonRowsShape } from '../../shared/components'

export const STATUS_TONE: Record<CareerStatus, BadgeTone> = { seeking: 'ac', feedback: 'orange', satisfied: 'green' }


export const PROPOSAL_MAX = 500

export const OFFER_BOOKMARKS_LIMIT = 10

export const HUB_SKELETON: SkeletonRowsShape = {
  count: 5,
  lead: { size: 52, radius: 26 },
  lines: [
    { width: '40%', height: 12 },
    { width: '85%', height: 16 },
    { width: '60%', height: 12 },
  ],
}
