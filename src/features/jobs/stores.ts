import { create } from 'zustand'
import type { PostingSort } from './types'
import { EMPTY, type Filters } from './utils/filters'

type JobListState = {
  filters: Filters
  sort: PostingSort
  setFilters: (filters: Filters) => void
  setSort: (sort: PostingSort) => void
  reset: () => void
}

export const useJobListStore = create<JobListState>()((set) => ({
  filters: EMPTY,
  sort: 'latest',
  setFilters: (filters) => set({ filters }),
  setSort: (sort) => set({ sort }),
  reset: () => set({ filters: EMPTY, sort: 'latest' }),
}))
