import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { create } from 'zustand'

export type ConsentModalRequest = {
  title: string
  body: string
  agree: string
  onAgree: () => void
  /** Without it the consent is required: no 나중에, and the sheet cannot be swiped away. */
  onLater?: () => void
}

export const CONSENT_DETAIL_LABEL = '자세히 보기'
export const CONSENT_LATER_LABEL = '나중에'

export const useConsentModal = create<{ request: ConsentModalRequest | null }>(() => ({ request: null }))

export const showConsentModal = ({ title, body, agree }: Pick<ConsentModalRequest, 'title' | 'body' | 'agree'>, { onAgree, onLater }: Pick<ConsentModalRequest, 'onAgree' | 'onLater'>) => {
  Keyboard.dismiss()
  useConsentModal.setState({ request: { title, body, agree, onAgree, onLater } })
  router.push('/consent')
}
