import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

export const useKeyboardHeight = () => {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const ios = Platform.OS === 'ios'
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setHeight(e.endCoordinates.height))
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0))
    return () => (show.remove(), hide.remove())
  }, [])
  return height
}
