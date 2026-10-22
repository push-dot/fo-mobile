import { create } from 'zustand'

type Recent = { terms: string[]; add: (t: string) => void; remove: (t: string) => void; clear: () => void }

// shortcut: in-memory only, resets on app restart; persist once a storage module is approved.
export const useRecentSearches = create<Recent>((set) => ({
  terms: ['백엔드 Kotlin', '모아페이', '데이터 엔지니어 판교'],
  add: (t) => set((s) => ({ terms: [t, ...s.terms.filter((x) => x !== t)].slice(0, 10) })),
  remove: (t) => set((s) => ({ terms: s.terms.filter((x) => x !== t) })),
  clear: () => set({ terms: [] }),
}))
