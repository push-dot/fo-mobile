import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { create } from 'zustand'

export type ChoiceModalRequest = {
  title: string
  message?: string
  table?: { head: string[]; rows: string[][] }
  /** A choice: one plain row per option; the modal closes first, then the option runs. */
  /** Gate choices are drawn as stacked buttons (the first is the main one), not as rows. */
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
  /** A confirmation: one primary button. A regular modal has no 취소 (owner rule 35); swiping it away is the way out. */
  confirm?: { label: string; onPress: () => void; secondary?: { label: string; onPress: () => void; /** Runs with the sheet still open (a page pushed over it, as the plan page is). */ stay?: boolean }; closeLabel?: string }
  /** The sheet was swiped away without a pick. */
  onDismiss?: () => void
}

// The sheet has to leave before a route or an alert is opened over the screen under it.
export const CHOICE_HANDOFF_MS = 400

export const useChoiceModal = create<{ request: ChoiceModalRequest | null }>(() => ({ request: null }))

/** A choice or confirmation that is not a warning: the regular modal (a sheet with no X and no 취소), not an alert or action sheet. */
export const showChoiceModal = (request: ChoiceModalRequest) => {
  // The sheet hides the keyboard but not the focus: a field left focused under it keeps its caret with no keyboard once the sheet is gone.
  Keyboard.dismiss()
  useChoiceModal.setState({ request })
  router.push('/choice')
}
