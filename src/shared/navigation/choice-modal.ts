import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { create } from 'zustand'

export type ChoiceModalRequest = {
  title: string
  message?: string
  buttons?: boolean
  items?: {
    label: string
    sub?: string
    destructive?: boolean
    chevron?: boolean
    onPress: () => void
  }[]
  form?: {
    options: { label: string; sub?: string }[]
    selected: number[]
    multi?: boolean
    allowEmpty?: boolean
    toggle?: { label: string; on: boolean }
    confirmLabel: (selected: number[], on: boolean) => string
    onConfirm: (selected: number[], on: boolean) => void
  }
  input?: { placeholder: string; confirm: string; keyboardType?: 'default' | 'url'; onSubmit: (text: string) => void }
  confirm?: { label: string; onPress: () => void; secondary?: { label: string; onPress: () => void }; closeLabel?: string }
  onDismiss?: () => void
}

export const CHOICE_HANDOFF_MS = 400

export const useChoiceModal = create<{ request: ChoiceModalRequest | null }>(() => ({ request: null }))

export const showChoiceModal = (request: ChoiceModalRequest) => {
  Keyboard.dismiss()
  useChoiceModal.setState({ request })
  router.push('/choice')
}
