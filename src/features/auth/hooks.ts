import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { useSession } from '@/shared/infrastructure'
import { readConsents } from './api/fetchers'
import { remainingSeconds, showAppleButton } from './utils/auth-flow'
import { runColdStartTermsCheck, shouldRunColdStartTermsForUser } from './utils/cold-start-terms'

const RECONSENT_TERMS_ROUTE = '/(app)/(stack)/reconsent-terms' as const

export const useCountdown = (endsAt: number | null) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endsAt == null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  if (endsAt == null) return 0
  return remainingSeconds(endsAt, now)
}

const loadAppleAuth = () => import('expo-apple-authentication')

export const useAppleSignIn = () => {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    let live = true
    void loadAppleAuth()
      .then(async (mod) => {
        const ok = await mod.isAvailableAsync()
        if (live) setAvailable(ok)
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])
  return showAppleButton(Platform.OS, available)
}

export const useColdStartTermsCheck = () => {
  const session = useSession((s) => s.session)
  const ranFor = useRef<string | null>(null)

  useEffect(() => {
    if (!session) return
    if (!shouldRunColdStartTermsForUser(ranFor.current, session.user.id)) return
    ranFor.current = session.user.id
    void runColdStartTermsCheck(session, readConsents, {
      route: () => router.replace(RECONSENT_TERMS_ROUTE),
    })
  }, [session])
}
