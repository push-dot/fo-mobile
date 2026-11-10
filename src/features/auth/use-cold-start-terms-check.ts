import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { useSession } from '@/shared/infrastructure'
import { readConsents } from './api/fetchers'
import { runColdStartTermsCheck, shouldRunColdStartTermsForUser } from './cold-start-terms'

const RECONSENT_TERMS_ROUTE = '/(app)/(stack)/reconsent-terms' as const

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
