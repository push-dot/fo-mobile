import { beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateQueries = vi.hoisted(() => vi.fn(async () => undefined))
let capturedOnSettled: (() => Promise<unknown>) | undefined

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: (opts: { onSettled?: () => Promise<unknown> }) => {
    capturedOnSettled = opts.onSettled
    return { mutate: vi.fn() }
  },
  useQuery: () => ({}),
  useInfiniteQuery: () => ({}),
  keepPreviousData: 'keep',
}))

vi.mock('./fetchers', () => ({
  togglePostingBookmark: vi.fn(),
  fetchPostingPages: vi.fn(),
  fetchPostingCount: vi.fn(),
  fetchMyProfile: vi.fn(),
  fetchPostingLocations: vi.fn(),
  applyToPosting: vi.fn(),
  fetchApplyDocs: vi.fn(),
  fetchPosting: vi.fn(),
}))

describe('useToggleBookmark', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnSettled = undefined
  })

  it('invalidates postings, search, and me bookmarks after settle', async () => {
    const { useToggleBookmark } = await import('./hooks')
    useToggleBookmark()
    expect(capturedOnSettled).toBeTypeOf('function')
    await capturedOnSettled!()
    expect(invalidateQueries).toHaveBeenCalledTimes(3)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['postings'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['search'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['me', 'bookmarks'] })
  })
})
