import type { ViewProps } from 'react-native'

/**
 * React Native's TextInput sets `onSelectionChangeShouldSetResponder` to always true after its own props, so it cannot be
 * turned off on the input. A selection change while a touch is tracked then hands the input the responder without a touch,
 * and the next touch end is the only release. Until then responder negotiation starts at the common ancestor of the input
 * and the touch target, so a sibling button is never asked and its tap is lost (offer reply sheet, accept and send).
 * Stopping the capture pass at the root leaves the input out of that negotiation. Its own taps still go through the press handlers.
 */
export const stopSelectionGrant = (e: { stopPropagation: () => void }) => {
  e.stopPropagation()
  return false
}

export const noSelectionGrant = { onSelectionChangeShouldSetResponderCapture: stopSelectionGrant } as ViewProps
