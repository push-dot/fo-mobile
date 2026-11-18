import { useIsFocused } from 'expo-router'
import { useEffect } from 'react'
import { useReferenceConsent } from '@/features/my'
import { askConsent } from '../stores'

/**
 * Consent is taken once, in Push Bot's onboarding, and it cannot be skipped: with it off no Bot can be made or used.
 * Push Bot asks whenever it is opened with consent off; the Bot home sends a person without consent to it.
 */
export const ConsentSheet = ({ kind }: { kind: 'push' | 'company' | undefined }) => {
  const focused = useIsFocused()
  const off = useReferenceConsent().data?.referenceData === false

  useEffect(() => {
    if (focused && off && kind === 'push') askConsent(true)
  }, [focused, off, kind])

  return null
}
