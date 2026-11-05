import { describe, expect, it } from 'vitest'
import { EMPTY } from './utils/filters'
import { useJobListStore } from './stores'

describe('useJobListStore', () => {
  it('setFilters replaces the filters', () => {
    useJobListStore.getState().setFilters({ ...EMPTY, category: ['dev'] })
    expect(useJobListStore.getState().filters).toEqual({ ...EMPTY, category: ['dev'] })
  })

  it('reset restores EMPTY and latest', () => {
    useJobListStore.getState().setSort('deadline')
    useJobListStore.getState().reset()
    expect(useJobListStore.getState().filters).toEqual(EMPTY)
    expect(useJobListStore.getState().sort).toBe('latest')
  })
})
