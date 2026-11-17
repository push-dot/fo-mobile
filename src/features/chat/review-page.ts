import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { create } from 'zustand'
import type { DiffLine } from './types'

export type ReviewPageRequest = {
  lines: DiffLine[]
  /** Present while the edit waits for an answer: the two buttons at the bottom. Without it the page only shows the document. */
  apply?: () => void
  undo?: () => void
  /** The page was closed without a pick. */
  onDismiss?: () => void
}

export const useReviewPage = create<{ request: ReviewPageRequest | null }>(() => ({ request: null }))

/** ChatApprove: the changed document as a page-style modal, not a sentence about the change. */
export const showReviewPage = (request: ReviewPageRequest) => {
  Keyboard.dismiss()
  useReviewPage.setState({ request })
  router.push('/review')
}
