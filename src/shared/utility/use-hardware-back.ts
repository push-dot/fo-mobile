import { useEffect } from 'react'
import { BackHandler } from 'react-native'

/** Android's back button (and back gesture): runs `onBack` instead of leaving the screen while it is set. iOS has no such event. */
export const useHardwareBack = (onBack: (() => void) | null) => {
  useEffect(() => {
    if (!onBack) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack()
      return true
    })
    return () => sub.remove()
  }, [onBack])
}
