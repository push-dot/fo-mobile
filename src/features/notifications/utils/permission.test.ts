import { describe, expect, it } from 'vitest'
import { showNotificationSettings } from './permission'

const snap = (status: 'granted' | 'denied' | 'undetermined', iosStatus?: number) => ({
  status,
  iosStatus,
})

describe('notification settings button', () => {
  it('stays hidden until the permission check returns', () => {
    expect(showNotificationSettings(null)).toBe(false)
  })

  it('shows only when Android permission is off', () => {
    expect(showNotificationSettings(snap('granted'))).toBe(false)
    expect(showNotificationSettings(snap('denied'))).toBe(true)
    expect(showNotificationSettings(snap('undetermined'))).toBe(true)
  })

  it('trusts the iOS authorization status over the root flag', () => {
    expect(showNotificationSettings(snap('granted', 0))).toBe(true)
    expect(showNotificationSettings(snap('granted', 1))).toBe(true)
    expect(showNotificationSettings(snap('denied', 2))).toBe(false)
    expect(showNotificationSettings(snap('denied', 3))).toBe(false)
    expect(showNotificationSettings(snap('denied', 4))).toBe(false)
  })
})
