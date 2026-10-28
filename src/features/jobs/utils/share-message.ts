import type { Posting } from '@push/api-client'
import { WEB_BASE_URL } from '../../../shared/infrastructure'

export const postingShareMessage = (id: string, posting?: Posting | null) =>
  `${posting ? `${posting.company} · ${posting.title}\n` : ''}${posting?.sourceUrl ?? `${WEB_BASE_URL}/postings/${id}`}`
