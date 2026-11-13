import { describe, expect, it } from 'vitest'
import { UNREAD } from './shapes'

describe('unread dot', () => {
  it('is 14 px with a 2.5 px ring, 3 px outside the corner, on the 52 px list avatar', () => {
    const px = 52 / 100
    expect(UNREAD.r * 2 * px).toBeCloseTo(14)
    expect((UNREAD.ring - UNREAD.r) * px).toBeCloseTo(2.5)
    expect((UNREAD.x + UNREAD.r) * px).toBeCloseTo(52 + 3)
    expect((UNREAD.y - UNREAD.r) * px).toBeCloseTo(-3)
  })
})
