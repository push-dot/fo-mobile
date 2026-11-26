import { describe, expect, it } from 'vitest'
import { patchPostingBookmark } from './bookmark-invalidation'

const posting = (id: string, bookmarked = false) => ({ id, title: id, bookmarked })
const page = (...data: ReturnType<typeof posting>[]) => ({ data, page: { nextCursor: null, hasMore: false } })

describe('patchPostingBookmark', () => {
  it('flips the posting inside infinite list pages', () => {
    const cached = { pages: [page(posting('a')), page(posting('b'), posting('c'))], pageParams: [undefined, 'x'] }
    const next = patchPostingBookmark(cached, 'b', true) as typeof cached
    expect(next.pages[1]!.data).toEqual([posting('b', true), posting('c')])
    expect(next.pages[0]).toBe(cached.pages[0])
    expect(next.pageParams).toBe(cached.pageParams)
  })

  it('flips the posting inside a list envelope', () => {
    const cached = page(posting('a', true), posting('b'))
    expect(patchPostingBookmark(cached, 'a', false)).toEqual(page(posting('a'), posting('b')))
  })

  it('flips a matching posting detail', () => {
    expect(patchPostingBookmark({ ...posting('a'), applied: true }, 'a', true)).toEqual({ ...posting('a', true), applied: true })
  })

  it('keeps the same object when nothing matches', () => {
    const list = page(posting('a'))
    const pages = { pages: [list], pageParams: [undefined] }
    const detail = posting('b')
    expect(patchPostingBookmark(list, 'z', true)).toBe(list)
    expect(patchPostingBookmark(pages, 'z', true)).toBe(pages)
    expect(patchPostingBookmark(detail, 'z', true)).toBe(detail)
  })

  it('leaves counts, locations and empty cache untouched', () => {
    const count = { data: { total: 3 } }
    const locations = { data: [{ id: 'a', name: '서울' }] }
    expect(patchPostingBookmark(count, 'a', true)).toBe(count)
    expect(patchPostingBookmark(locations, 'a', true)).toBe(locations)
    expect(patchPostingBookmark(undefined, 'a', true)).toBeUndefined()
  })
})
