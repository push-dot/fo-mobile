import { showChoiceModal } from './choice-modal'

type Copy = { title: string; body: string; detail: string; agree: string }

export const showConsentModal = (copy: Copy, { onAgree, onLater }: { onAgree: () => void; onLater: () => void }) =>
  showChoiceModal({ title: copy.title, message: `${copy.body}\n\n${copy.detail}`, confirm: { label: copy.agree, onPress: onAgree }, onDismiss: onLater })
