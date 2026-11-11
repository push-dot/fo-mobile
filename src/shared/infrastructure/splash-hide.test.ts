import { describe, expect, it, vi } from 'vitest'
import { shouldHideSplash, SPLASH_ABSOLUTE_TIMEOUT_MS, SPLASH_SNAPSHOT_TIMEOUT_MS } from './splash-hide'

describe('shouldHideSplash', () => {
  const base = {
    sessionReady: true,
    themeReady: true,
    hasSession: false,
    snapshotReady: false,
    timedOut: false,
    absoluteTimedOut: false,
  }

  it('waits for session and theme gates', () => {
    expect(shouldHideSplash({ ...base, sessionReady: false })).toBe(false)
    expect(shouldHideSplash({ ...base, themeReady: false })).toBe(false)
  })

  it('hides immediately when logged out', () => {
    expect(shouldHideSplash({ ...base, hasSession: false })).toBe(true)
  })

  it('waits for snapshot while logged in', () => {
    expect(
      shouldHideSplash({
        ...base,
        hasSession: true,
        snapshotReady: false,
        timedOut: false,
      }),
    ).toBe(false)
    expect(
      shouldHideSplash({
        ...base,
        hasSession: true,
        snapshotReady: true,
        timedOut: false,
      }),
    ).toBe(true)
  })

  it('hides on absolute timeout even when session or theme gates are open', () => {
    expect(
      shouldHideSplash({
        ...base,
        sessionReady: false,
        themeReady: false,
        hasSession: true,
        snapshotReady: false,
        timedOut: false,
        absoluteTimedOut: true,
      }),
    ).toBe(true)
  })

  it('hides after snapshot timeout while logged in', () => {
    expect(
      shouldHideSplash({
        ...base,
        hasSession: true,
        snapshotReady: false,
        timedOut: true,
      }),
    ).toBe(true)
  })
})

describe('splash snapshot timeout', () => {
  it('fires hide after SPLASH_SNAPSHOT_TIMEOUT_MS with fake timers', () => {
    vi.useFakeTimers()
    let timedOut = false
    const t = setTimeout(() => {
      timedOut = true
    }, SPLASH_SNAPSHOT_TIMEOUT_MS)
    vi.advanceTimersByTime(SPLASH_SNAPSHOT_TIMEOUT_MS - 1)
    expect(
      shouldHideSplash({
        sessionReady: true,
        themeReady: true,
        hasSession: true,
        snapshotReady: false,
        timedOut,
        absoluteTimedOut: false,
      }),
    ).toBe(false)
    vi.advanceTimersByTime(1)
    clearTimeout(t)
    timedOut = true
    expect(
      shouldHideSplash({
        sessionReady: true,
        themeReady: true,
        hasSession: true,
        snapshotReady: false,
        timedOut,
        absoluteTimedOut: false,
      }),
    ).toBe(true)
    vi.useRealTimers()
  })
})

describe('splash absolute timeout', () => {
  it('fires hide after SPLASH_ABSOLUTE_TIMEOUT_MS with fake timers', () => {
    vi.useFakeTimers()
    let absoluteTimedOut = false
    const t = setTimeout(() => {
      absoluteTimedOut = true
    }, SPLASH_ABSOLUTE_TIMEOUT_MS)
    vi.advanceTimersByTime(SPLASH_ABSOLUTE_TIMEOUT_MS - 1)
    expect(
      shouldHideSplash({
        sessionReady: false,
        themeReady: false,
        hasSession: false,
        snapshotReady: false,
        timedOut: false,
        absoluteTimedOut,
      }),
    ).toBe(false)
    vi.advanceTimersByTime(1)
    clearTimeout(t)
    absoluteTimedOut = true
    expect(
      shouldHideSplash({
        sessionReady: false,
        themeReady: false,
        hasSession: false,
        snapshotReady: false,
        timedOut: false,
        absoluteTimedOut,
      }),
    ).toBe(true)
    vi.useRealTimers()
  })
})
