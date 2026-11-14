import { describe, expect, it } from 'vitest'
import { gridCardWidth, gridFillWidth } from './grid'

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

  it('fills the loading skeleton row without the 169 cap (JobListLoading: 175pt on 402)', () => {
    expect(gridFillWidth(402)).toBe(175)
    expect(gridFillWidth(402) * 2 + 12 + 40).toBe(402)
    expect(gridFillWidth(375)).toBe(gridCardWidth(375))
  })
})
