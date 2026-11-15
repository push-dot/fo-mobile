import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Alert } from 'react-native'
import { updateReferenceConsent } from '@/features/my/api/fetchers'
import { showConsentAlert } from '@/shared/components'
import { CONSENT_AGREE, CONSENT_BODY, CONSENT_DETAIL, CONSENT_LATER, CONSENT_MORE, CONSENT_TITLE } from '../constants'
import { grantConsent, laterConsent, useConsentPrompt } from '../stores'

const COPY = { title: CONSENT_TITLE, body: CONSENT_BODY, more: CONSENT_MORE, detail: CONSENT_DETAIL, agree: CONSENT_AGREE, later: CONSENT_LATER }

/** Shows the platform's consent alert when askConsent toggles the prompt, with no consent read on mount. */
export const ConsentPromptListener = () => {
  const open = useConsentPrompt((s) => s.open)
  const qc = useQueryClient()
  useEffect(() => {
    if (!open) return
    showConsentAlert(COPY, {
      onLater: laterConsent,
      onAgree: () =>
        updateReferenceConsent(true).then(
          (data) => (qc.setQueryData(['me', 'consents'], data), grantConsent()),
          () => (Alert.alert('동의를 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'), laterConsent()),
        ),
    })
  }, [open, qc])
  return null
}
