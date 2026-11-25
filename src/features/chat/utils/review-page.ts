import { router } from 'expo-router'
import { Keyboard } from 'react-native'
import { useReviewPage } from '../stores'
import type { ReviewPageRequest } from '../types'

export const showReviewPage = (request: ReviewPageRequest) => {
  Keyboard.dismiss()
  useReviewPage.setState({ request })
  router.push('/review')
}
