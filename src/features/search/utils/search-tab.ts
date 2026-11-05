export type SearchTab = 'postings' | 'people' | 'posts'

export const TABS: { key: SearchTab; label: string; unit: string }[] = [
  { key: 'postings', label: '공고', unit: '개' },
  { key: 'people', label: '사람', unit: '명' },
  { key: 'posts', label: '게시글', unit: '개' },
]

export const isSearchTab = (v: unknown): v is SearchTab => TABS.some((t) => t.key === v)
