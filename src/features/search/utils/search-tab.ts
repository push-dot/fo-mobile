export type SearchTab = 'postings' | 'people' | 'posts'

export const TABS: { key: SearchTab; label: string; unit: string }[] = [
  { key: 'postings', label: '공고', unit: '개' },
  { key: 'people', label: '사람', unit: '명' },
  { key: 'posts', label: '게시글', unit: '개' },
]

export const isSearchTab = (v: unknown): v is SearchTab => TABS.some((t) => t.key === v)

/** `GET search/counts`: one number per tab, so the chips show counts without fetching the tabs that are not open. */
export type SearchCounts = Record<SearchTab, number>

type TabList = { data?: { pages: { page: { total?: number } }[] }; isPlaceholderData: boolean }

/**
 * A chip's count. A tab whose list is loaded for this query shows that list's total, the number its header repeats.
 * Any other tab shows the server's count. A list kept from the previous query counts as not loaded. The server's
 * counts stay from the previous query until the new ones arrive, one request, so the chips keep a number while loading.
 */
export const chipCount = (list: TabList, counted: number | undefined) =>
  (list.isPlaceholderData ? undefined : list.data?.pages[0]?.page.total) ?? counted
