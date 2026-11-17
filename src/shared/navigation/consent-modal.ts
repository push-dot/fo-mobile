import { router } from 'expo-router'
import { showChoiceModal } from './choice-modal'

type Copy = { title: string; body: string; agree: string }

const DETAIL_LABEL = '자세히 보기'

/** The consent modal: one agree button, 자세히 보기 reads the policy over the open modal, and there is no 나중에 (swiping it down is the way out). */
export const showConsentModal = (copy: Copy, { onAgree, onLater }: { onAgree: () => void; onLater: () => void }) =>
  showChoiceModal({
    title: copy.title,
    message: copy.body,
    confirm: {
      label: copy.agree,
      onPress: onAgree,
      secondary: { label: DETAIL_LABEL, stay: true, onPress: () => router.push({ pathname: '/(app)/(stack)/terms-view', params: { term: 'privacyPolicy' } }) },
    },
    onDismiss: onLater,
  })
