import { describe, expect, it } from 'vitest'
import { POP, popTop } from './row-menu-layout'

describe('popTop', () => {
  it('sits 16 below the row, as the board draws it', () => {
    expect(popTop({ y: 372, height: 76 }, POP.height(5), 800)).toBe(464)
  })

  it('moves above the row when the pop would pass the screen bottom', () => {
    const height = POP.height(5)
    expect(popTop({ y: 600, height: 76 }, height, 800)).toBe(600 - 16 - height)
  })
})
