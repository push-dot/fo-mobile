import { describe, expect, it } from 'vitest'
import { composerPadding } from './composer-padding'

describe('composerPadding', () => {
  it('sits 12pt from the edges and 6pt above the home indicator on iOS', () => {
    expect(composerPadding(true, 34, false)).toEqual({ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 40 })
  })

  it('drops to the inset minus 6 with the keyboard up, never below 8', () => {
    expect(composerPadding(true, 34, true).paddingBottom).toBe(28)
    expect(composerPadding(true, 10, true).paddingBottom).toBe(8)
  })

  it('keeps the Android padding unchanged', () => {
    expect(composerPadding(false, 34, false)).toEqual({ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 42 })
    expect(composerPadding(false, 34, true).paddingBottom).toBe(8)
  })
})
