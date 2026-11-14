import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RISE_MS, RISE_SLACK_MS, riseOnMount } from './approval-rise'

describe('riseOnMount', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('plays the rise at once and lands the open position even if the animation never reports', () => {
    const rise = { setValue: vi.fn() }
    const play = vi.fn()
    riseOnMount(rise, play)
    expect(play).toHaveBeenCalledOnce()
    expect(rise.setValue).not.toHaveBeenCalled()
    vi.advanceTimersByTime(RISE_MS + RISE_SLACK_MS)
    expect(rise.setValue).toHaveBeenCalledWith(1)
  })

  it('cancels the end value when the panel unmounts first', () => {
    const rise = { setValue: vi.fn() }
    const stop = riseOnMount(rise, vi.fn())
    stop()
    vi.advanceTimersByTime(RISE_MS + RISE_SLACK_MS)
    expect(rise.setValue).not.toHaveBeenCalled()
  })
})
