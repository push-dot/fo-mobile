import { describe, expect, it } from 'vitest'
import { headerInset } from './header-inset'

describe('headerInset', () => {
  it('pads a back-button header 12 on iOS and 8 on Android, a close-button sheet header 20', () => {
    expect(headerInset(true, true)).toBe(12)
    expect(headerInset(false, true)).toBe(8)
    expect(headerInset(true, false)).toBe(20)
    expect(headerInset(false, false)).toBe(20)
  })
})
