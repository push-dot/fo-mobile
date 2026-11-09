import { describe, expect, it } from 'vitest'
import { threadInset } from '../utils/thread-inset'

const base = { bottomH: 160, keyboard: 0, navBar: 0, approval: false, android: false }

describe('threadInset', () => {
  it('keeps the thread a step above the composer', () => {
    expect(threadInset(base)).toBe(176)
  })

  it('rides the keyboard with a smaller step', () => {
    expect(threadInset({ ...base, keyboard: 336 })).toBe(504)
  })

  it('adds the nav bar on Android while the keyboard is up, not otherwise', () => {
    expect(threadInset({ ...base, keyboard: 320, navBar: 16, android: true })).toBe(504)
    expect(threadInset({ ...base, keyboard: 320, navBar: 40, android: true })).toBe(528)
    expect(threadInset({ ...base, navBar: 40, android: true })).toBe(176)
  })

  it('leaves the design gap above an approval sheet per platform', () => {
    expect(threadInset({ ...base, bottomH: 260, approval: true })).toBe(306)
    expect(threadInset({ ...base, bottomH: 260, approval: true, android: true })).toBe(285)
  })

  it('gives the status row the design lift: 14 on iOS, 22 on Android, the keyboard step when typing', () => {
    expect(threadInset({ ...base, status: true })).toBe(174)
    expect(threadInset({ ...base, status: true, android: true })).toBe(182)
    expect(threadInset({ ...base, status: true, keyboard: 336 })).toBe(504)
  })
})
