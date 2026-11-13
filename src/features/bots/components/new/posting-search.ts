import { api } from '@/shared/infrastructure'
import { dayOf } from '../../api/schemas'
import { postingMeta, type PostingPick } from '../../utils/create-form'

const SEARCH_LIMIT = 20

export type PostingRow = PostingPick & { meta: string }

const rowOf = (posting: { id: string; company: string; title: string; deadline: string | null; careerMin: number; careerMax: number | null }): PostingRow => ({
  postingId: posting.id,
  company: posting.company,
  title: posting.title,
  meta: postingMeta({ deadline: dayOf(posting.deadline), careerMin: posting.careerMin, careerMax: posting.careerMax }),
})

export const searchPostings = async (q: string): Promise<PostingRow[]> => {
  const page = await api.postings.list({ q, limit: SEARCH_LIMIT })
  return page.data.map(rowOf)
}

export const loadPosting = async (id: string): Promise<PostingPick | null> => {
  try {
    const posting = await api.postings.get(id)
    return { postingId: posting.id, company: posting.company, title: posting.title }
  } catch {
    return null
  }
}
