import { useIsFocused, router } from 'expo-router'
import { useEffect } from 'react'
import { useReferenceConsent } from '@/features/my'
import { askConsent, useConsentPrompt } from '../stores'
import { consentPath } from '../utils/sheet-routes'

/** Opens the native consent sheet when reference data is still off. */
export const ConsentSheet = () => {
  const focused = useIsFocused()
  const open = useConsentPrompt((s) => s.open)
  const consent = useReferenceConsent()

  useEffect(() => {
    if (focused && consent.data?.referenceData === false) askConsent(false)
  }, [focused, consent.data?.referenceData])

  useEffect(() => {
    if (open) router.push(consentPath())
  }, [open])

  return null
}
