import { colors } from '@push/design-system'
import { describe, expect, it } from 'vitest'
import { NATIVE_FONTS } from './fonts'
import { navigationColors } from './navigation-colors'
import { onAccent } from './on-accent'
import { tabColor } from './tab-color'

describe('design system wiring', () => {
  it('navigation colours come from the active scheme', () => {
    expect(navigationColors(colors.light)).toEqual({
      primary: colors.light.ac,
      background: colors.light.bg,
      card: colors.light.card,
      text: colors.light.t1,
      border: colors.light.line,
      notification: colors.light.red,
    })
    expect(navigationColors(colors.dark).primary).toBe(colors.dark.ac)
    expect(navigationColors(colors.dark).background).toBe(colors.dark.bg)
  })

  it('ios tab colors', () => {
    expect(tabColor('ios', false, colors.light)).toBe(colors.light.t1)
    expect(tabColor('ios', true, colors.light)).toBe(colors.light.acText)
  })

  it('android tab colors', () => {
    expect(tabColor('android', false, colors.light)).toBe(colors.light.t3)
    expect(tabColor('android', true, colors.light)).toBe(colors.light.t1)
  })

  it('loads Pretendard under the design-system weights', () => {
    expect(NATIVE_FONTS).toEqual({
      '400': 'Pretendard-Regular',
      '500': 'Pretendard-Medium',
      '600': 'Pretendard-SemiBold',
      '700': 'Pretendard-Bold',
      '800': 'Pretendard-ExtraBold',
    })
  })

  it('on-accent ink is the design-system paper', () => {
    expect(onAccent).toBe(colors.light.bg)
  })
})
