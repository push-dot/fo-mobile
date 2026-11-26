export const SPLASH_SNAPSHOT_TIMEOUT_MS = 2000

export type SplashHideInputs = {
  hasSession: boolean
  snapshotReady: boolean
  timedOut: boolean
}

export const shouldHideSplash = (s: SplashHideInputs): boolean => !s.hasSession || s.snapshotReady || s.timedOut
