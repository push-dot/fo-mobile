import { describe, expect, it } from 'vitest'
import { floatingSheet } from '../sheet-scale'

describe('floating sheet', () => {
  it('lays out at the floating width and scales back up on iOS 26 phones with a home indicator', () => {
    expect(floatingSheet(402, '26.3', 34, false)).toEqual({ width: 386, scale: 402 / 386 })
    expect(floatingSheet(440, 26, 34, false)?.width).toBe(424)
  })

  it('keeps the layout width but draws 1:1 while the keyboard attaches the sheet', () => {
    expect(floatingSheet(402, '26.3', 34, true)).toEqual({ width: 386, scale: 1 })
  })

  it('draws 1:1 below iOS 26 and on home-button phones', () => {
    expect(floatingSheet(402, '18.6', 34, false)).toBeNull()
    expect(floatingSheet(375, '26.0', 0, false)).toBeNull()
  })
})
