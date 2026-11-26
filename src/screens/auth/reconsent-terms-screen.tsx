import { useEffect, useState } from 'react'
import { router, useIsFocused } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { TRY_AGAIN, TermsConsentForm, saveTerms, useTermsConsent } from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { showToast } from '@/shared/components'
import { consentsQuery, marketingResult } from '@/features/my'
import { useHardwareBack } from '@/shared/utility'

const HOME_ROUTE = '/(app)/(stack)/(tabs)/(home)' as const

const ReconsentTermsScreen = () => {
  const qc = useQueryClient()
  const session = useSession((s) => s.session)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const focused = useIsFocused()

  useEffect(() => {
    if (!session) router.replace(HOME_ROUTE)
  }, [session])

  useEffect(() => () => useTermsConsent.getState().reset(), [])

  useHardwareBack(focused ? () => undefined : null)

  const submit = (marketing: boolean) => {
    if (!session) return
    setBusy(true)
    setError(null)
    saveTerms(undefined, marketing)
      .then((consent) => {
        qc.setQueryData(consentsQuery.queryKey, consent)
        if (marketing) showToast({ message: marketingResult(true, consent.terms?.marketingAt ?? null) })
        router.replace(HOME_ROUTE)
      })
      .catch(() => setError(TRY_AGAIN))
      .finally(() => setBusy(false))
  }

  return <TermsConsentForm termsViewRoute="/(app)/(stack)/terms-view" busy={busy} error={error} onSubmit={submit} />
}

export default ReconsentTermsScreen
