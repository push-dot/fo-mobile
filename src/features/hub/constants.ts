import type { CareerStatus } from '@push/api-client'
import type { BadgeTone } from '../../shared/components'

export const STATUS_TONE: Record<CareerStatus, BadgeTone> = { seeking: 'ac', feedback: 'orange', satisfied: 'green' }

export const FILLS = ['#3B5BDB', '#0C8599', '#E8590C', '#5F3DC4', '#2F9E44']

export const PROPOSAL_MAX = 500

export const OFFER_BOOKMARKS_LIMIT = 10
