import { describe, expect, it } from 'vitest'
import { TABS } from './search-tab'

describe('TABS', () => {
  it('counts people in 명 and the rest in 개', () => {
    expect(TABS.map((t) => t.unit)).toEqual(['개', '명', '개'])
  })
})
