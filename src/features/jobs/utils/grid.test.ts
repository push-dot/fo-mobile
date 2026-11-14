import { describe, expect, it } from 'vitest'
import { gridCardWidth } from './grid'

describe('gridCardWidth', () => {
  it('draws the boards 169pt card on a 402pt screen (cover 115pt, right margin 32)', () => {
    const w = gridCardWidth(402)
    expect(w).toBe(169)
    expect(Math.round((w * 136) / 200)).toBe(115)
    expect(402 - 20 - w * 2 - 12).toBe(32)
  })

  it('fills the row on a 390pt screen and shrinks below it', () => {
    expect(gridCardWidth(390)).toBe(169)
    expect(gridCardWidth(375)).toBe(161)
  })
})
