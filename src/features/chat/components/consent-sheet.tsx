import { useIsFocused } from 'expo-router'
import { useEffect, useRef } from 'react'
import { useReferenceConsent } from '@/features/my'
import { askConsent } from '../stores'

export const ConsentSheet = ({ kind }: { kind: 'push' | 'company' | undefined }) => {
  const focused = useIsFocused()
  const off = useReferenceConsent().data?.referenceData === false
  const askedThisVisit = useRef(false)

  useEffect(() => {
    if (!focused || !off || kind !== 'push' || askedThisVisit.current) return
    askedThisVisit.current = true
    askConsent(true)
  }, [focused, off, kind])

  return null
}
