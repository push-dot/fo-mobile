import { describe, expect, it } from 'vitest'
import { chipCount, TABS } from './search-tab'

describe('TABS', () => {
  it('counts people in 명 and the rest in 개', () => {
    expect(TABS.map((t) => t.unit)).toEqual(['개', '명', '개'])
  })
})

const loaded = (total?: number) => ({ data: { pages: [{ page: { total } }] }, isPlaceholderData: false })

describe('chipCount', () => {
  it('shows the server count for a tab that was never opened', () => {
    expect(chipCount({ isPlaceholderData: false }, 8)).toBe(8)
  })

  it('shows the open list total over the server count, so the chip and the header agree', () => {
    expect(chipCount(loaded(24), 25)).toBe(24)
  })

  it('ignores a list kept from the previous query', () => {
    expect(chipCount({ ...loaded(13), isPlaceholderData: true }, 3)).toBe(3)
    expect(chipCount({ ...loaded(13), isPlaceholderData: true }, undefined)).toBeUndefined()
  })

  it('falls back to the server count when the list has no total', () => {
    expect(chipCount(loaded(undefined), 13)).toBe(13)
  })

  it('shows no count when neither is known', () => {
    expect(chipCount({ isPlaceholderData: false }, undefined)).toBeUndefined()
  })
})
