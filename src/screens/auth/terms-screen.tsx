import { useEffect, useRef, useState } from 'react'
import { Stack, router, useIsFocused } from 'expo-router'
import { TRY_AGAIN, TermsConsentForm, saveTerms, useTermsConsent, usePhoneAuth } from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { showToast } from '@/shared/components'
import { marketingResult } from '@/features/my'
import { useHardwareBack } from '@/shared/utility'

const TermsScreen = () => {
  const held = usePhoneAuth((state) => state.held)
  const clear = usePhoneAuth((state) => state.clear)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const left = useRef(false)
  const focused = useIsFocused()

  useEffect(() => {
    if (!held) router.replace('/sign-in')
  }, [held])

  useEffect(() => {
    left.current = false
    return () => {
      left.current = true
      useTermsConsent.getState().reset()
      if (usePhoneAuth.getState().held) clear()
    }
  }, [clear])

  const leave = () => {
    left.current = true
    router.dismissTo('/sign-in')
  }

  useHardwareBack(focused ? leave : null)

  const submit = (marketing: boolean) => {
    if (!held) return
    setBusy(true)
    setError(null)
    saveTerms(held.accessToken, marketing)
      .then(async (consent) => {
        if (left.current) return
        if (marketing) showToast({ message: marketingResult(true, consent.terms?.marketingAt ?? null) })
        await useSession.getState().set(held)
        clear()
      })
      .catch(() => setError(TRY_AGAIN))
      .finally(() => setBusy(false))
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <TermsConsentForm termsViewRoute="/terms-view" busy={busy} error={error} onSubmit={submit} onBack={leave} padRows />
    </>
  )
}

export default TermsScreen
