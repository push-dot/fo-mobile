export type SearchTab = 'postings' | 'people' | 'posts'

export const TABS: { key: SearchTab; label: string }[] = [
  { key: 'postings', label: '공고' },
  { key: 'people', label: '사람' },
  { key: 'posts', label: '게시글' },
]

export const isSearchTab = (v: unknown): v is SearchTab => TABS.some((t) => t.key === v)
