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

  it('leaves room for the float scale of an iOS 26 partial sheet', () => {
    // (874 - 62 - 16) / 1.0415 - 185: the region list may not exceed what keeps the scaled sheet under the top gap
    expect(sheetScrollMax(874, 62, 0, 185, 1, 402 / 386)).toBeCloseTo(579.4, 0)
    expect(sheetScrollMax(874, 62, 0, 185, 1)).toBeCloseTo(611, 0)
  })

  it('keeps a usable minimum', () => {
    expect(sheetScrollMax(667, 20, 336, 320, 0.6)).toBe(96)
  })
})
