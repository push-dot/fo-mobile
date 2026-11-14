import { describe, expect, it } from 'vitest'
import { TAB_CLEARANCE } from './copy'
import { barLift } from './bar-lift'

describe('bot home bar', () => {
  it('rests above the floating iOS tab bar, 8pt above the Android edge', () => {
    expect(barLift(0, true)).toBe(TAB_CLEARANCE + 8)
    expect(barLift(0, false)).toBe(8)
  })

  it('rests 8pt above the whole iOS keyboard, never under it (AgentHomeSearch)', () => {
    expect(barLift(334, true)).toBe(342)
  })

  it('keeps the Android keyboard offset, which leaves the tab bar out', () => {
    expect(barLift(300, false)).toBe(300 - TAB_CLEARANCE)
    expect(barLift(40, false)).toBe(0)
  })
})
