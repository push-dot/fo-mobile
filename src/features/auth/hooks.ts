import { needsTerms } from '@push/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { consentsQuery } from '@/features/my'
import { useSession } from '@/shared/infrastructure'
import { remainingSeconds, showAppleButton } from './utils/auth-flow'

const RECONSENT_TERMS_ROUTE = '/(app)/(stack)/reconsent-terms' as const

export const useCountdown = (endsAt: number | null) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endsAt == null) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= endsAt) clearInterval(id)
    }, 1000)
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
  const qc = useQueryClient()
  const userId = useSession((s) => s.session?.user.id)
  useEffect(() => {
    if (!userId) return
    let live = true
    qc.fetchQuery(consentsQuery).then(
      (consent) => {
        if (live && needsTerms(consent)) router.replace(RECONSENT_TERMS_ROUTE)
      },
      () => undefined,
    )
    return () => {
      live = false
    }
  }, [qc, userId])
}
