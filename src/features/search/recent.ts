import { create } from 'zustand'

// 지금 많이 찾는 검색어 1–8위 (Search board).
// shortcut: fixed list; needs a trending endpoint in push-be to be real.
export const POPULAR_TERMS = ['프론트엔드', 'React', '신입 개발자', 'AI 엔지니어', 'PM', '재택 근무', 'Go', '데이터 분석']

type Recent = { terms: string[]; add: (t: string) => void; remove: (t: string) => void; clear: () => void }

// shortcut: in-memory only, resets on app restart; persist once a storage module is approved.
export const useRecentSearches = create<Recent>((set) => ({
  terms: ['백엔드 Kotlin', '모아페이', '데이터 엔지니어 판교'],
  add: (t) => set((s) => ({ terms: [t, ...s.terms.filter((x) => x !== t)].slice(0, 10) })),
  remove: (t) => set((s) => ({ terms: s.terms.filter((x) => x !== t) })),
  clear: () => set({ terms: [] }),
}))
