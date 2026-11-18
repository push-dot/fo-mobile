import { describe, expect, it } from 'vitest'
import { isStrandedTap } from '../stranded-tap'

const BOX = { x: 24, y: 337, width: 354, height: 56 }

describe('isStrandedTap', () => {
  it('taps a button whose press-in never came (the offer reply sheet failure: touch 200,364 inside box 24,337,354x56)', () => {
    expect(isStrandedTap(false, { x: 200, y: 364 }, { x: 200, y: 364 }, BOX)).toBe(true)
  })

  it('leaves a press Pressable already granted to Pressable', () => {
    expect(isStrandedTap(true, { x: 200, y: 364 }, { x: 200, y: 364 }, BOX)).toBe(false)
  })

  it('ignores a drag, even one that ends inside the button', () => {
    expect(isStrandedTap(false, { x: 100, y: 364 }, { x: 200, y: 364 }, BOX)).toBe(false)
  })

  it('ignores a touch that ends outside the button', () => {
    expect(isStrandedTap(false, { x: 200, y: 364 }, { x: 200, y: 420 }, BOX)).toBe(false)
  })
})
