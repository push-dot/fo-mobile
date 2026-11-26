import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import { useHomeSnapshotReady } from '@/features/home'
import { useSession } from './session-store'
import { SPLASH_SNAPSHOT_TIMEOUT_MS, shouldHideSplash } from './splash-hide'

const SplashGate = () => {
  const sessionId = useSession((s) => s.session?.user.id ?? null)
  const snapshotReady = useHomeSnapshotReady()
  const [timeoutForUser, setTimeoutForUser] = useState<string | null>(null)
  const timedOut = sessionId !== null && timeoutForUser === sessionId
  const hidden = useRef(false)

  useEffect(() => {
    if (!sessionId) return
    const t = setTimeout(() => setTimeoutForUser(sessionId), SPLASH_SNAPSHOT_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [sessionId])

  useEffect(() => {
    if (hidden.current) return
    if (!shouldHideSplash({ hasSession: sessionId !== null, snapshotReady, timedOut })) return
    hidden.current = true
    void (async () => {
      try {
        await SplashScreen.hideAsync()
      } catch {
      }
    })()
  }, [sessionId, snapshotReady, timedOut])

  return null
}

export default SplashGate
