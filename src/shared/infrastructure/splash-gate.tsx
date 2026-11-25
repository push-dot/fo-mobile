import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import { useHomeSnapshotReady } from '@/features/home'
import { useSession } from './session-store'
import { SPLASH_ABSOLUTE_TIMEOUT_MS, SPLASH_SNAPSHOT_TIMEOUT_MS, shouldHideSplash } from './splash-hide'

type Props = {
  sessionReady: boolean
  themeReady: boolean
}

const SplashGate = ({ sessionReady, themeReady }: Props) => {
  const session = useSession((s) => s.session)
  const sessionId = session?.user.id ?? null
  const snapshotReady = useHomeSnapshotReady()
  const [timeoutForUser, setTimeoutForUser] = useState<string | null>(null)
  const [absoluteTimedOut, setAbsoluteTimedOut] = useState(false)
  const timedOut = sessionId !== null && timeoutForUser === sessionId
  const hidden = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setAbsoluteTimedOut(true), SPLASH_ABSOLUTE_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    const t = setTimeout(() => setTimeoutForUser(sessionId), SPLASH_SNAPSHOT_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [sessionId])

  useEffect(() => {
    if (hidden.current) return
    if (
      !shouldHideSplash({
        sessionReady,
        themeReady,
        hasSession: !!session,
        snapshotReady,
        timedOut,
        absoluteTimedOut,
      })
    ) {
      return
    }
    hidden.current = true
    void (async () => {
      try {
        await SplashScreen.hideAsync()
      } catch {
      }
    })()
  }, [sessionReady, themeReady, session, snapshotReady, timedOut, absoluteTimedOut])

  return null
}

export default SplashGate
