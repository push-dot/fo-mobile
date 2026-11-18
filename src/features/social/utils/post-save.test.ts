import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { invalidateAfterPostSaveToggle, saveMenuAction } from './post-save'

describe('saveMenuAction', () => {
  it('offers 저장 with the plain bookmark before the post is saved', () => {
    const a = saveMenuAction(false, vi.fn())
    expect([a.label, a.systemImage]).toEqual(['저장', 'bookmark'])
  })

  it('offers 저장 해제 with the filled bookmark once saved, and runs the toggle on press', () => {
    const toggle = vi.fn()
    const a = saveMenuAction(true, toggle)
    expect([a.label, a.systemImage]).toEqual(['저장 해제', 'bookmark.fill'])
    a.onPress()
    expect(toggle).toHaveBeenCalledOnce()
  })
})

describe('invalidateAfterPostSaveToggle', () => {
  it('marks every 저장한 글 sort and that post stale, and no other post or list', async () => {
    const qc = new QueryClient()
    for (const key of [['me', 'saved-posts', 'latest'], ['me', 'saved-posts', 'views'], ['me', 'posts', 'latest'], ['post', 'p1'], ['post', 'p2'], ['posts', null]]) qc.setQueryData(key, {})
    await invalidateAfterPostSaveToggle(qc, 'p1')
    const stale = qc.getQueryCache().getAll().filter((q) => q.state.isInvalidated).map((q) => q.queryKey)
    expect(stale).toEqual([['me', 'saved-posts', 'latest'], ['me', 'saved-posts', 'views'], ['post', 'p1']])
  })
})
