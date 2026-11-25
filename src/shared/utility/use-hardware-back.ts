import { useEffect } from 'react'
import { BackHandler } from 'react-native'

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
