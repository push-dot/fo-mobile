import { beforeEach, describe, expect, it, vi } from 'vitest'
import { palette, radius } from '@/theme'

const platform = vi.hoisted(() => ({ OS: 'ios' }))
vi.mock('react-native', () => ({ Platform: platform }))
vi.mock('expo-secure-store', () => ({}))

const { fullSheetOptions, sheetOptions } = await import('./sheet-options')
const c = palette.light

beforeEach(() => {
  platform.OS = 'ios'
})

describe('sheetOptions', () => {
  it('presents a native form sheet that fits its content by default', () => {
    expect(sheetOptions(c)).toMatchObject({ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', headerShown: false })
  })

  it('passes custom detents through', () => {
    expect(sheetOptions(c, [0.5, 1]).sheetAllowedDetents).toEqual([0.5, 1])
  })

  it('uses the iOS grabber and lets the system sheet material show through', () => {
    const o = sheetOptions(c)
    expect(o.sheetGrabberVisible).toBe(true)
    expect(o.sheetCornerRadius).toBeUndefined()
    expect(o.contentStyle).toEqual({ backgroundColor: 'transparent' })
  })

  it('uses the design sheet top corners and theme surface on Android', () => {
    platform.OS = 'android'
    const o = sheetOptions(c)
    expect(o.sheetCornerRadius).toBe(radius.sheetTop)
    expect(o.contentStyle).toEqual({ backgroundColor: c.bg })
  })

  it('draws a full-height sheet opaque on both platforms', () => {
    expect(fullSheetOptions(c)).toMatchObject({ sheetAllowedDetents: [1], contentStyle: { backgroundColor: c.bg } })
  })
})
