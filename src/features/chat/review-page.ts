import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { create } from 'zustand'
import type { DiffLine } from './types'

export type ReviewPageRequest = {
  lines: DiffLine[]
  apply?: () => void
  undo?: () => void
  onDismiss?: () => void
}

export const useReviewPage = create<{ request: ReviewPageRequest | null }>(() => ({ request: null }))

export const showReviewPage = (request: ReviewPageRequest) => {
  Keyboard.dismiss()
  useReviewPage.setState({ request })
  router.push('/review')
}
