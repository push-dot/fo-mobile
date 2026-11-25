import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

export const useKeyboardHeight = () => {
  const [height, setHeight] = useState(() => (Keyboard.isVisible() ? (Keyboard.metrics()?.height ?? 0) : 0))
  useEffect(() => {
    const ios = Platform.OS === 'ios'
    const onShow = (e: { endCoordinates: { height: number } }) => setHeight(e.endCoordinates.height)
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', onShow)
    const shown = ios ? Keyboard.addListener('keyboardDidShow', onShow) : undefined
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0))
    return () => (show.remove(), shown?.remove(), hide.remove())
  }, [])
  return height
}
