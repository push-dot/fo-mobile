import { describe, expect, it, vi } from 'vitest'
import { appearFrom, appearMoves, appearMs, playAppear } from './appear'

const value = () => ({ setValue: vi.fn() })

describe('playAppear', () => {
  it('starts the timing and stops it on cleanup', () => {
    const v = value()
    const stop = vi.fn()
    const start = vi.fn(() => ({ stop }))
    const cleanup = playAppear(v, { still: false, reduce: false }, start)
    expect(start).toHaveBeenCalledTimes(1)
    expect(v.setValue).not.toHaveBeenCalled()
    cleanup?.()
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('lands on 1 without a timing when Reduce Motion is on', () => {
    const v = value()
    const start = vi.fn()
    expect(playAppear(v, { still: false, reduce: true }, start)).toBeUndefined()
    expect(v.setValue).toHaveBeenCalledWith(1)
    expect(start).not.toHaveBeenCalled()
  })

  it('Reduce Motion arriving after mount: the running timing stops, then the value lands on 1', () => {
    const v = value()
    const order: string[] = []
    const first = playAppear(v, { still: false, reduce: false }, () => ({ stop: () => order.push('stop') }))
    v.setValue.mockImplementation(() => order.push('set 1'))
    first?.() // the effect's cleanup when `reduce` flips
    playAppear(v, { still: false, reduce: true }, vi.fn())
    expect(order).toEqual(['stop', 'set 1'])
  })

  it('does nothing for a row that is already still', () => {
    const v = value()
    const start = vi.fn()
    expect(playAppear(v, { still: true, reduce: false }, start)).toBeUndefined()
    expect(start).not.toHaveBeenCalled()
    expect(v.setValue).not.toHaveBeenCalled()
  })
})

describe('appearMoves', () => {
  it('keeps the transform for every moving row (Reduce Motion is not an input)', () => {
    expect(appearMoves('bubble', false)).toBe(true)
    expect(appearMoves('up', false)).toBe(true)
    expect(appearMoves('fade', false)).toBe(false)
    expect(appearMoves('bubble', true)).toBe(false)
  })
})

describe('entry numbers', () => {
  it('bubble 400ms from 18pt / .94, rise 300ms from 10pt, fade 250ms', () => {
    expect(appearMs('bubble')).toBe(400)
    expect(appearMs('up')).toBe(300)
    expect(appearMs('fade')).toBe(250)
    expect(appearMs('up', 250)).toBe(250)
    expect(appearFrom('bubble')).toEqual({ dy: 18, scale: 0.94 })
    expect(appearFrom('up')).toEqual({ dy: 10, scale: 1 })
  })
})
