import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { create } from 'zustand'

export type ConsentModalRequest = {
  title: string
  body: string
  agree: string
  onAgree: () => void
  onLater?: () => void
  onDismiss?: () => void
}

export const CONSENT_DETAIL_LABEL = '자세히 보기'
export const CONSENT_LATER_LABEL = '나중에'

export const useConsentModal = create<{ request: ConsentModalRequest | null }>(() => ({ request: null }))

export const showConsentModal = ({ title, body, agree }: Pick<ConsentModalRequest, 'title' | 'body' | 'agree'>, { onAgree, onLater, onDismiss }: Pick<ConsentModalRequest, 'onAgree' | 'onLater' | 'onDismiss'>) => {
  Keyboard.dismiss()
  useConsentModal.setState({ request: { title, body, agree, onAgree, onLater, onDismiss } })
  router.push('/consent')
}
