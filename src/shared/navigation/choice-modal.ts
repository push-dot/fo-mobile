import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { create } from 'zustand'

export type ChoiceModalRequest = {
  title: string
  message?: string
  /** A choice: one plain row per option; the modal closes first, then the option runs. */
  items?: { label: string; destructive?: boolean; /** The row opens something next: a grey › at its right edge. */ chevron?: boolean; onPress: () => void }[]
  /** One pick out of rows, an optional switch row, and a button that names the pick (ChatPh4Design). */
  form?: {
    options: { label: string; sub?: string }[]
    selected: number
    toggle?: { label: string; on: boolean }
    confirmLabel: (selected: number, on: boolean) => string
    onConfirm: (selected: number, on: boolean) => void
  }
  /** A confirmation: one primary button. A regular modal has no 취소 (owner rule 35); swiping it away is the way out. `closeLabel` adds a 닫기 button left of it (DocProfileConfirm, owner 2026-11-16). */
  confirm?: { label: string; onPress: () => void; closeLabel?: string }
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
