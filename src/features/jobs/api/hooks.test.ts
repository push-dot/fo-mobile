import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invalidateAfterPostingBookmarkToggle } from './bookmark-invalidation'

const invalidateQueries = vi.fn(async () => undefined)

describe('invalidateAfterPostingBookmarkToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates postings, search, and me bookmarks', async () => {
    await invalidateAfterPostingBookmarkToggle({ invalidateQueries })
    expect(invalidateQueries).toHaveBeenCalledTimes(3)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['postings'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['search'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['me', 'bookmarks'] })
  })
})
