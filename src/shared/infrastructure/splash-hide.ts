export const SPLASH_SNAPSHOT_TIMEOUT_MS = 2000

/** Failsafe: hide splash even when session or theme gates never complete. */
export const SPLASH_ABSOLUTE_TIMEOUT_MS = 6000

export type SplashHideInputs = {
  sessionReady: boolean
  themeReady: boolean
  hasSession: boolean
  snapshotReady: boolean
  timedOut: boolean
  absoluteTimedOut: boolean
}

/** True when native splash may hide (session/theme gates passed; snapshot or timeout when logged in). */
export const shouldHideSplash = (s: SplashHideInputs): boolean => {
  if (s.absoluteTimedOut) return true
  if (!s.sessionReady || !s.themeReady) return false
  if (!s.hasSession) return true
  return s.snapshotReady || s.timedOut
}
