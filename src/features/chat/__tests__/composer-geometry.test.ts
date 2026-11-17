import { describe, expect, it } from 'vitest'
import { creditBannerMarginBottom, emptyFieldHeight, mentionListMarginBottom, quickStartMarginBottom } from '../utils/composer-geometry'

describe('composer geometry (v489 boards)', () => {
  it('keeps the quick start chips 70 above the box with the area gap of 8', () => {
    expect(quickStartMarginBottom + 8).toBe(70)
  })

  it('sits the credit banner 7 above the box', () => {
    expect(creditBannerMarginBottom).toBe(7)
  })

  it('draws the @ list 2 above the box, the 12 it sits at without a margin less 10', () => {
    expect(12 + mentionListMarginBottom).toBe(2)
  })

  it('makes an empty field one line high and leaves a typed field to grow', () => {
    expect(emptyFieldHeight('', 22, 1)).toBe(22)
    expect(emptyFieldHeight('', 22, 1.5)).toBe(33)
    expect(emptyFieldHeight('안녕', 22, 1)).toBeUndefined()
  })
})
