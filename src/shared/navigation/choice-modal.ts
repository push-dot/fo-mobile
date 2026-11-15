import { router } from 'expo-router'
import { create } from 'zustand'

export type ChoiceModalRequest = {
  title: string
  message?: string
  /** A choice: one plain row per option; the modal closes first, then the option runs. */
  items?: { label: string; destructive?: boolean; onPress: () => void }[]
  /** A confirmation: one primary button. A regular modal has no 취소 (owner rule 35); swiping it away is the way out. */
  confirm?: { label: string; onPress: () => void }
  /** The sheet was swiped away without a pick. */
  onDismiss?: () => void
}

// The sheet has to leave before a route or an alert is opened over the screen under it.
export const CHOICE_HANDOFF_MS = 400

export const useChoiceModal = create<{ request: ChoiceModalRequest | null }>(() => ({ request: null }))

/** A choice or confirmation that is not a warning: the regular modal (a sheet with no X and no 취소), not an alert or action sheet. */
export const showChoiceModal = (request: ChoiceModalRequest) => {
  useChoiceModal.setState({ request })
  router.push('/choice')
}
