import type { SectionKind } from '@/features/jobs'
import { api } from '../../../shared/infrastructure'
import { HOME_POSTING_LIMIT } from '../constants'

export const fetchHomePostings = (kind: SectionKind) => api.postings.list({ sort: kind, limit: HOME_POSTING_LIMIT })
