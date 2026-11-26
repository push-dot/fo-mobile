import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { TRY_AGAIN, TermsConsentForm, saveTerms, useTermsConsent, usePhoneAuth } from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { showToast } from '@/shared/components'
import { marketingResult } from '@/features/my'

const TermsScreen = () => {
  const held = usePhoneAuth((state) => state.held)
  const clear = usePhoneAuth((state) => state.clear)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!held) router.replace('/sign-in')
  }, [held])

  useEffect(
    () => () => {
      useTermsConsent.getState().reset()
      if (usePhoneAuth.getState().held) clear()
    },
    [clear],
  )

  const leave = () => {
    if (held) clear()
    router.back()
  }

  const submit = (marketing: boolean) => {
    if (!held) return
    setBusy(true)
    setError(null)
    saveTerms(held.accessToken, marketing)
      .then(async (consent) => {
        if (marketing) showToast({ message: marketingResult(true, consent.terms?.marketingAt ?? null) })
        await useSession.getState().set(held)
        clear()
      })
      .catch(() => setError(TRY_AGAIN))
      .finally(() => setBusy(false))
  }

  return <TermsConsentForm termsViewRoute="/terms-view" busy={busy} error={error} onSubmit={submit} onBack={leave} padRows />
}

export default TermsScreen
