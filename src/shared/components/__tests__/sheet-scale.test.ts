import { describe, expect, it } from 'vitest'
import { floatingSheet } from '../sheet-scale'

describe('floating sheet', () => {
  it('lays out at the floating width and scales back up on iOS 26 phones with a home indicator', () => {
    expect(floatingSheet(402, '26.3', 34, false)).toMatchObject({ width: 386, scale: 402 / 386 })
    expect(floatingSheet(440, 26, 34, false)?.width).toBe(424)
  })

  it('keeps the layout width but draws 1:1 while the keyboard attaches the sheet', () => {
    expect(floatingSheet(402, '26.3', 34, true)).toMatchObject({ width: 386, scale: 1 })
  })

  it('draws 1:1 below iOS 26 and on home-button phones', () => {
    expect(floatingSheet(402, '18.6', 34, false)).toBeNull()
    expect(floatingSheet(375, '26.0', 0, false)).toBeNull()
  })

  it('reads the major version from point releases and non-numeric strings', () => {
    expect(floatingSheet(402, '25.9', 34, false)).toBeNull()
    expect(floatingSheet(402, 'beta', 34, false)).toBeNull()
  })

  it('trims the sheet so the drawn content ends 20pt above the sheet edge', () => {
    const drawnGap = (keyboardUp: boolean, height: number) => {
      const float = floatingSheet(402, '26.3', 34, keyboardUp)!
      return (height + float.marginBottom(height) + 34) / float.scale - height
    }
    expect(drawnGap(false, 160)).toBeCloseTo(20)
    expect(drawnGap(false, 420)).toBeCloseTo(20)
    expect(drawnGap(true, 160)).toBeCloseTo(20)
    expect(drawnGap(true, 420)).toBeCloseTo(20)
  })
})
