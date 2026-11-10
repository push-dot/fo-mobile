import { router } from 'expo-router'
import { useEffect } from 'react'
import { useConsentPrompt } from '../stores'
import { consentPath } from '../utils/sheet-routes'

export const routeConsentWhenOpen = (open: boolean) => {
  if (open) router.push(consentPath())
}

/** Opens the consent sheet when askConsent toggles the prompt — no consent API reads on mount. */
export const ConsentPromptListener = () => {
  const open = useConsentPrompt((s) => s.open)
  useEffect(() => routeConsentWhenOpen(open), [open])
  return null
}
