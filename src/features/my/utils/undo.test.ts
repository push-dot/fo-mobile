import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createUndo } from './undo'

describe('createUndo', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('commits the id once the window passes, not before', () => {
    const commit = vi.fn()
    createUndo(commit, 5000).start('a')
    vi.advanceTimersByTime(4999)
    expect(commit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(commit).toHaveBeenCalledExactlyOnceWith('a')
  })

  it('never commits after cancel', () => {
    const commit = vi.fn()
    const undo = createUndo(commit, 5000)
    undo.start('a')
    undo.cancel()
    vi.advanceTimersByTime(10_000)
    undo.flush()
    expect(commit).not.toHaveBeenCalled()
  })

  it('flush commits immediately and only once', () => {
    const commit = vi.fn()
    const undo = createUndo(commit, 5000)
    undo.start('a')
    undo.flush()
    expect(commit).toHaveBeenCalledExactlyOnceWith('a')
    undo.flush()
    vi.advanceTimersByTime(10_000)
    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('flush after the timer committed is a no-op', () => {
    const commit = vi.fn()
    const undo = createUndo(commit, 5000)
    undo.start('a')
    vi.advanceTimersByTime(5000)
    undo.flush()
    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('commits the earlier id when a new one starts inside the window', () => {
    const commit = vi.fn()
    const undo = createUndo(commit, 5000)
    undo.start('a')
    vi.advanceTimersByTime(3000)
    undo.start('b')
    expect(commit).toHaveBeenCalledExactlyOnceWith('a')
    vi.advanceTimersByTime(4999)
    expect(commit).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(commit).toHaveBeenLastCalledWith('b')
    expect(commit).toHaveBeenCalledTimes(2)
  })

  it('is busy only while a window is open', () => {
    const undo = createUndo(vi.fn(), 5000)
    expect(undo.busy()).toBe(false)
    undo.start('a')
    expect(undo.busy()).toBe(true)
    vi.advanceTimersByTime(5000)
    expect(undo.busy()).toBe(false)
  })
})
