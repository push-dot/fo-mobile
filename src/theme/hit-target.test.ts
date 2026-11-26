import { describe, expect, it } from 'vitest'
import { HIT_TARGET, hitSlopTo } from './hit-target'

describe('hit targets', () => {
  it('hit target is at least 48', () => {
    expect(HIT_TARGET).toBeGreaterThanOrEqual(48)
  })

  it('hitSlop grows a small control to 48 without resizing it', () => {
    expect(hitSlopTo(28)).toEqual({ top: 10, bottom: 10, left: 0, right: 0 })
    expect(hitSlopTo(40, 40)).toEqual({ top: 4, bottom: 4, left: 4, right: 4 })
    expect(hitSlopTo(56, 56)).toEqual({ top: 0, bottom: 0, left: 0, right: 0 })
  })
})
