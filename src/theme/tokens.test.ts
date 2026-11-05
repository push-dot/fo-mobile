import { colors, radius as designRadius } from '@push/design-system'
import { describe, expect, it } from 'vitest'
import { nativeShadow } from './native-shadow'
import { palette, radius, shadow, type } from './tokens'

describe('theme tokens', () => {
  it('read every colour from the design system', () => {
    expect(palette).toBe(colors)
    expect(palette.light.t3).toBe('#646B75')
    expect(palette.dark.ac).toBe('#6B5BFA')
  })

  it('read radius from the design system', () => {
    expect(radius).toBe(designRadius)
  })

  it('turn em tracking into points and weights into strings', () => {
    expect(type.h1).toEqual({ fontSize: 26, lineHeight: 36, fontWeight: '800', letterSpacing: 26 * -0.03 })
    expect(type.b2).toEqual({ fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 15 * -0.02 })
  })

  it('keep the native shadows the app drew before', () => {
    expect(shadow).toEqual({
      light: {
        pop: { shadowColor: '#16191D', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
        glass: { shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      },
      dark: {
        pop: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
        glass: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      },
    })
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
