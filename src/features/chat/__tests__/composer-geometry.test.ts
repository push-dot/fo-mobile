import { describe, expect, it } from 'vitest'
import { creditBannerMarginBottom, emptyFieldHeight, mentionListMarginBottom, quickStartMarginBottom, quickStartShadowRoom, composerFontScale } from '../utils/composer-geometry'

describe('composer geometry (v489 boards)', () => {
  it('keeps the quick start chips 8 above the box after the area gap and shadow room', () => {
    expect(quickStartMarginBottom + 8 + quickStartShadowRoom).toBe(8)
  })

  it('sits the credit banner 7 above the box', () => {
    expect(creditBannerMarginBottom).toBe(7)
  })

  it('keeps the @ list the same 8 above the box as the quick start chips', () => {
    expect(mentionListMarginBottom + 8).toBe(8)
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
