import { describe, expect, it } from 'vitest'
import { creditBannerMarginBottom, emptyFieldHeight, mentionListMarginBottom, quickStartMarginBottom, composerFontScale } from '../utils/composer-geometry'

describe('composer geometry (v489 boards)', () => {
  it('keeps the quick start chips 70 above the box with the area gap of 8', () => {
    expect(quickStartMarginBottom + 8).toBe(70)
  })

  it('sits the credit banner 7 above the box', () => {
    expect(creditBannerMarginBottom).toBe(7)
  })

  it('pulls the @ list 10 down from the area gap so the board shows it 2 above the box', () => {
    expect(mentionListMarginBottom).toBe(-10)
  })

  it('makes an empty field one line high and leaves a typed field to grow', () => {
    expect(emptyFieldHeight('', 22, 1)).toBe(22)
    expect(emptyFieldHeight('', 22, 1.5)).toBe(33)
    expect(emptyFieldHeight('안녕', 22, 1)).toBeUndefined()
  })
})

describe('composerFontScale', () => {
  it('ignores the system size in the XL board only', () => {
    expect(composerFontScale(true, 1.235)).toBe(1)
    expect(composerFontScale(false, 1.235)).toBe(1.235)
  })
})
