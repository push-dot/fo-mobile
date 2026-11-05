import { describe, expect, it } from 'vitest'
import { HIT_TARGET, STATUS_ROW_MIN_HEIGHT } from './hit-target'

describe('hit targets', () => {
  it('hit target is at least 48', () => {
    expect(HIT_TARGET).toBeGreaterThanOrEqual(48)
  })

  it('status row uses minHeight', () => {
    expect(STATUS_ROW_MIN_HEIGHT).toEqual({ ios: 36, android: 28 })
    expect(STATUS_ROW_MIN_HEIGHT.ios).toBeLessThan(HIT_TARGET)
    expect(STATUS_ROW_MIN_HEIGHT.android).toBeLessThan(HIT_TARGET)
  })
})
