import { focusManager } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppState, Platform, type AppStateStatus } from 'react-native'

export const useAppStateFocus = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return
    const onChange = (status: AppStateStatus) => focusManager.setFocused(status === 'active')
    const sub = AppState.addEventListener('change', onChange)
    return () => sub.remove()
  }, [])
}
