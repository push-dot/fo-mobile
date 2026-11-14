import { describe, expect, it, vi } from 'vitest'
import { isXlBoardText, isXlScale, XL_BOARD_TEXT_SCALE, XL_TEXT_SCALE, xlChrome } from './xl-chrome'

vi.mock('react-native', () => ({ useWindowDimensions: () => ({ fontScale: 1 }) }))

describe('isXlBoardText', () => {
  it('turns on for the harness XL sizes (iOS extra-extra-large 1.235, Android 1.3) and above', () => {
    expect(isXlBoardText(1.235)).toBe(true)
    expect(isXlBoardText(1.3)).toBe(true)
    expect(isXlBoardText(1.5)).toBe(true)
  })

  it('stays off at the default and the next size below the XL ones (iOS 1.12, Android 1.15)', () => {
    expect(isXlBoardText(1)).toBe(false)
    expect(isXlBoardText(1.12)).toBe(false)
    expect(isXlBoardText(1.15)).toBe(false)
    expect(XL_BOARD_TEXT_SCALE).toBe(1.2)
  })
})

describe('isXlScale', () => {
  it('keeps the chrome, Home, Profile and Materials XL boxes at 1.5, where those boards were drawn', () => {
    expect(XL_TEXT_SCALE).toBe(1.5)
    expect(isXlScale(1.235)).toBe(false)
    expect(isXlScale(1.5)).toBe(true)
  })
})

describe('xlChrome', () => {
  it('draws the boards 52pt header buttons and 68pt rows under .xl, 44 and 56 otherwise', () => {
    expect(xlChrome(true)).toEqual({ button: 52, row: 68 })
    expect(xlChrome(false)).toEqual({ button: 44, row: 56 })
  })
})
