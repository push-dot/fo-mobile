import { create } from 'zustand'

type Recent = { terms: string[]; add: (t: string) => void; remove: (t: string) => void; clear: () => void }

export const useRecentSearches = create<Recent>((set) => ({
  terms: [],
  add: (t) => set((s) => ({ terms: [t, ...s.terms.filter((x) => x !== t)].slice(0, 10) })),
  remove: (t) => set((s) => ({ terms: s.terms.filter((x) => x !== t) })),
  clear: () => set({ terms: [] }),
}))
