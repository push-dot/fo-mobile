import { router } from 'expo-router'
import { Alert } from 'react-native'
import { consentsQuery, grantReferenceAccess } from '@/features/my'
import { queryClient } from '@/providers/query-client'
import { showConsentModal } from '@/shared/navigation'
import { CONSENT_COPY } from '../components/new/copy'
import { botNewPath } from './paths'

const grantThen = (open: () => void) =>
  grantReferenceAccess().then(
    (data) => {
      queryClient.setQueryData(consentsQuery.queryKey, data)
      void queryClient.invalidateQueries({ queryKey: ['me', 'settings'] })
      open()
    },
    () => Alert.alert('동의를 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  )

export const openBotNew = async (postingId?: string) => {
  const open = () => router.push(botNewPath(postingId))
  const consents = await queryClient.ensureQueryData(consentsQuery).catch(() => null)
  if (consents?.referenceData !== false) return open()
  showConsentModal(CONSENT_COPY, { onAgree: () => void grantThen(open), onLater: () => undefined })
}
