import { router } from 'expo-router'
import { Alert } from 'react-native'
import { fetchConsents, grantReferenceAccess } from '@/features/my/api/fetchers'
import { queryClient } from '@/providers/query-client'
import { showConsentModal } from '@/shared/navigation'
import { CONSENT_COPY } from '../components/new/copy'
import { botNewPath } from './paths'

const grantThen = (open: () => void) =>
  grantReferenceAccess().then(
    (data) => {
      queryClient.setQueryData(['me', 'consents'], data)
      void queryClient.invalidateQueries({ queryKey: ['me', 'settings'] })
      open()
    },
    () => Alert.alert('동의를 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  )

/**
 * Opens the new-Bot page. The consent modal is the gate in front of it (a modal never opens over the page modal): swiping it down stays where
 * the person was, 동의하고 시작하기 saves the consent and opens the page. A consent that cannot be read does not block; the server still answers.
 */
export const openBotNew = async (postingId?: string) => {
  const open = () => router.push(botNewPath(postingId))
  const consents = await queryClient.fetchQuery({ queryKey: ['me', 'consents'], queryFn: fetchConsents, staleTime: 0 }).catch(() => null)
  if (consents?.referenceData !== false) return open()
  showConsentModal(CONSENT_COPY, { onAgree: () => void grantThen(open), onLater: () => undefined })
}
