import { colors, radius as designRadius } from '@push/design-system'
import { describe, expect, it } from 'vitest'
import { nativeShadow } from './native-shadow'
import { platformTokens } from './platform'
import { largeType, palette, radius, shadow, spacing, type } from './tokens'

describe('theme tokens', () => {
  it('read every colour from the design system', () => {
    expect(palette).toBe(colors)
    expect(palette.light.t3).toBe('#646B75')
    expect(palette.dark.ac).toBe('#6B5BFA')
  })

  it('read radius from the design system', () => {
    expect(radius).toBe(designRadius)
  })

  it('keeps weight off the style bag so Android does not load another face', () => {
    expect(type.h1).toEqual({ fontSize: 26, lineHeight: 36, weight: '800', letterSpacing: 26 * -0.03 })
    expect(type.b2).toEqual({ fontSize: 15, lineHeight: 22, weight: '400', letterSpacing: 15 * -0.02 })
    expect(type.h1).not.toHaveProperty('fontWeight')
    expect(type.b2).not.toHaveProperty('fontWeight')
  })

  it('keep the native shadows the app drew before', () => {
    expect(shadow).toEqual({
      light: {
        pop: { shadowColor: '#16191D', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
        glass: { shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
        icon: { shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 6 } },
        panel: { shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 15, shadowOffset: { width: 0, height: -4 } },
      },
      dark: {
        pop: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
        glass: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
        icon: { shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 6 } },
        panel: { shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 15, shadowOffset: { width: 0, height: -4 } },
      },
    })
  })
})

describe('handoff extras', () => {
  it('scale large text with the same tracking and weight', () => {
    expect(largeType.h1).toEqual({ fontSize: 34, lineHeight: 44, weight: '800', letterSpacing: 34 * -0.03 })
    expect(largeType.c2).toEqual({ fontSize: 16, lineHeight: 22, weight: '400', letterSpacing: 16 * -0.02 })
  })

  it('pick button corners and canvas insets per platform', () => {
    expect(platformTokens('ios')).toEqual({ safeTop: 54, safeBottom: 34, tabBarHeight: 94, buttonRadius: 28, buttonSmRadius: 20 })
    expect(platformTokens('android')).toEqual({ safeTop: 40, safeBottom: 20, tabBarHeight: 78, buttonRadius: 16, buttonSmRadius: 12 })
    expect(spacing[5]).toBe(20)
  })
})

describe('nativeShadow', () => {
  it('uses the first layer of a CSS shadow with half its blur', () => {
    expect(nativeShadow('0 6px 24px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.95)')).toEqual({
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    })
  })

  it('rejects a shadow it cannot read', () => {
    expect(() => nativeShadow('none')).toThrow('none')
  })
})
