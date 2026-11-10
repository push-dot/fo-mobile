import { useIsFocused } from 'expo-router'
import { useEffect } from 'react'
import { useReferenceConsent } from '@/features/my'
import { askConsent } from '../stores'

/** When the chat stack is focused, loads consent and nudges the sheet if reference data is still off. */
export const ConsentSheet = () => {
  const focused = useIsFocused()
  const consent = useReferenceConsent()

  useEffect(() => {
    if (focused && consent.data?.referenceData === false) askConsent(false)
  }, [focused, consent.data?.referenceData])

  return null
}
