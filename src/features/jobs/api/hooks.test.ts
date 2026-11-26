import { QueryClient } from '@tanstack/react-query'
import type { Posting } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ qc: null as unknown as QueryClient, toggle: vi.fn() }))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => h.qc,
    useMutation: (options: object) => ({ mutate: (variables: unknown) => new actual.MutationObserver(h.qc, options as never).mutate(variables as never).catch(() => undefined) }),
  }
})
vi.mock('@/providers/query-client', () => ({ queryClient: {} }))
vi.mock('@/shared/infrastructure', () => ({ WEB_BASE_URL: 'https://example.test' }))
vi.mock('./fetchers', () => ({ togglePostingBookmark: h.toggle }))

const { useToggleBookmark } = await import('./hooks')

const posting = { id: 'p1', title: 't', bookmarked: false } as Posting
const envelope = (bookmarked: boolean) => ({ data: [{ ...posting, bookmarked }], page: { nextCursor: null, hasMore: false } })
const KEYS = {
  list: ['postings', 'list', {}],
  detail: ['postings', 'detail', 'p1'],
  search: ['search', 'postings', '백엔드', 'relevance'],
  bookmarks: ['me', 'bookmarks'],
  calendar: ['calendar', '2026-11-20T00:00:00.000Z'],
  profile: ['me', 'profile'],
}

const seed = () => {
  h.qc.setQueryData(KEYS.list, { pages: [envelope(false)], pageParams: [undefined] })
  h.qc.setQueryData(KEYS.detail, posting)
  h.qc.setQueryData(KEYS.search, { pages: [envelope(false)], pageParams: [undefined] })
  h.qc.setQueryData(KEYS.bookmarks, envelope(false))
  h.qc.setQueryData(KEYS.calendar, {})
  h.qc.setQueryData(KEYS.profile, {})
}

const invalidated = () =>
  h.qc
    .getQueryCache()
    .getAll()
    .filter((q) => q.state.isInvalidated)
    .map((q) => q.queryKey)

beforeEach(() => {
  h.qc = new QueryClient()
  h.toggle.mockReset()
  seed()
})

describe('useToggleBookmark', () => {
  it('shows the new bookmark everywhere before the server answers', async () => {
    let answer = () => {}
    h.toggle.mockImplementation(() => new Promise<void>((resolve) => (answer = resolve)))
    const done = useToggleBookmark()(posting) as unknown as Promise<unknown>
    await vi.waitFor(() => expect(h.toggle).toHaveBeenCalled())
    expect(h.qc.getQueryData(KEYS.list)).toEqual({ pages: [envelope(true)], pageParams: [undefined] })
    expect(h.qc.getQueryData(KEYS.search)).toEqual({ pages: [envelope(true)], pageParams: [undefined] })
    expect(h.qc.getQueryData(KEYS.detail)).toEqual({ ...posting, bookmarked: true })
    expect(h.qc.getQueryData(KEYS.bookmarks)).toEqual(envelope(true))
    answer()
    await done
    expect(invalidated()).toEqual([KEYS.bookmarks, KEYS.calendar])
  })

  it('restores every cached posting when the server rejects', async () => {
    h.toggle.mockRejectedValue(new Error('offline'))
    await (useToggleBookmark()(posting) as unknown as Promise<unknown>)
    expect(h.qc.getQueryData(KEYS.list)).toEqual({ pages: [envelope(false)], pageParams: [undefined] })
    expect(h.qc.getQueryData(KEYS.detail)).toEqual(posting)
    expect(h.qc.getQueryData(KEYS.bookmarks)).toEqual(envelope(false))
    expect(invalidated()).toEqual([KEYS.list, KEYS.detail, KEYS.search, KEYS.bookmarks, KEYS.calendar])
  })
})
