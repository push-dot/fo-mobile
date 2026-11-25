import type { ViewProps } from 'react-native'

export const stopSelectionGrant = (e: { stopPropagation: () => void }) => {
  e.stopPropagation()
  return false
}

export const noSelectionGrant = { onSelectionChangeShouldSetResponderCapture: stopSelectionGrant } as ViewProps
