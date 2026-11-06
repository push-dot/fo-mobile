import { describe, expect, it } from 'vitest'
import { sheetScrollMax } from './sheet-height'

describe('sheetScrollMax', () => {
  it('keeps the design share of the window when there is room', () => {
    expect(sheetScrollMax(874, 62, 0, 200, 0.55)).toBeCloseTo(480.7)
  })

  it('shrinks to the room the header, CTA and keyboard leave on a small phone', () => {
    expect(sheetScrollMax(667, 20, 0, 320, 0.55)).toBe(311)
    expect(sheetScrollMax(667, 20, 260, 240, 0.55)).toBe(131)
  })

  it('keeps a usable minimum', () => {
    expect(sheetScrollMax(667, 20, 336, 320, 0.6)).toBe(96)
  })
})
