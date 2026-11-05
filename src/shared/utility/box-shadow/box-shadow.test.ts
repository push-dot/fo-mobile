import { describe, expect, it } from 'vitest'
import { shadow } from '../../../theme/tokens'
import { toBoxShadow } from './box-shadow'

describe('toBoxShadow', () => {
  it('turns the light glass shadow into the design shadow-glass value', () => {
    expect(toBoxShadow(shadow.light.glass)).toBe('0px 6px 24px rgba(0,0,0,0.1)')
  })

  it('keeps the dark glass opacity', () => {
    expect(toBoxShadow(shadow.dark.glass)).toBe('0px 6px 24px rgba(0,0,0,0.5)')
  })

  it('reads the shadow color channels', () => {
    expect(toBoxShadow({ ...shadow.light.pop, shadowColor: '#16191D' })).toBe('0px 8px 28px rgba(22,25,29,0.1)')
  })
})
