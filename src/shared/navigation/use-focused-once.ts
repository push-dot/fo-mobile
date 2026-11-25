import { useIsFocused } from 'expo-router'
import { useState } from 'react'

export const useFocusedOnce = (): boolean => {
  const focused = useIsFocused()
  const [seen, setSeen] = useState(focused)
  if (focused && !seen) setSeen(true)
  return seen || focused
}
