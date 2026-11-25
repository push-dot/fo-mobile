import { useIsFocused } from 'expo-router'
import { useEffect } from 'react'
import { useReferenceConsent } from '@/features/my'
import { askConsent } from '../stores'

export const ConsentSheet = ({ kind }: { kind: 'push' | 'company' | undefined }) => {
  const focused = useIsFocused()
  const off = useReferenceConsent().data?.referenceData === false

  useEffect(() => {
    if (focused && off && kind === 'push') askConsent(true)
  }, [focused, off, kind])

  return null
}
