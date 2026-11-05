import type { JobCategory } from '@push/api-client'
import { create } from 'zustand'
import { EMPTY_SHEET, type SheetFilters } from './utils'

type HubFilterState = {
  category: JobCategory[]
  sheet: SheetFilters
  setCategory: (category: JobCategory[]) => void
  setSheet: (sheet: SheetFilters) => void
  reset: () => void
}

export const useHubFilterStore = create<HubFilterState>()((set) => ({
  category: [],
  sheet: EMPTY_SHEET,
  setCategory: (category) => set({ category }),
  setSheet: (sheet) => set({ sheet }),
  reset: () => set({ category: [], sheet: EMPTY_SHEET }),
}))
