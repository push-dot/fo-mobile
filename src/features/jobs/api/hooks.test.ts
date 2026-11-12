import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { invalidateAfterPostingBookmarkToggle } from './bookmark-invalidation'

const KEYS = [
  ['postings', 'list', {}],
  ['postings', 'detail', 'p1'],
  ['search', 'postings', '백엔드', 'relevance'],
  ['search', 'people', '백엔드', 'relevance'],
  ['search', 'posts', '백엔드', 'relevance'],
  ['search', 'counts', '백엔드'],
  ['search', 'trending'],
  ['me', 'bookmarks'],
  ['me', 'profile'],
]

describe('invalidateAfterPostingBookmarkToggle', () => {
  it('marks stale every query that shows a posting bookmark, and no search count, trending, or other tab', async () => {
    const qc = new QueryClient()
    for (const key of KEYS) qc.setQueryData(key, {})
    await invalidateAfterPostingBookmarkToggle(qc)
    const stale = qc
      .getQueryCache()
      .getAll()
      .filter((q) => q.state.isInvalidated)
      .map((q) => q.queryKey)
    expect(stale).toEqual([['postings', 'list', {}], ['postings', 'detail', 'p1'], ['search', 'postings', '백엔드', 'relevance'], ['me', 'bookmarks']])
  })
})
