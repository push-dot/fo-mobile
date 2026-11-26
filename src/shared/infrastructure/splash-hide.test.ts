import { describe, expect, it } from 'vitest'
import { shouldHideSplash } from './splash-hide'

describe('shouldHideSplash', () => {
  const base = { hasSession: false, snapshotReady: false, timedOut: false }

  it('hides immediately when logged out', () => {
    expect(shouldHideSplash(base)).toBe(true)
  })

  it('waits for snapshot while logged in', () => {
    expect(shouldHideSplash({ ...base, hasSession: true })).toBe(false)
    expect(shouldHideSplash({ ...base, hasSession: true, snapshotReady: true })).toBe(true)
  })

  it('hides after snapshot timeout while logged in', () => {
    expect(shouldHideSplash({ ...base, hasSession: true, timedOut: true })).toBe(true)
  })
})
