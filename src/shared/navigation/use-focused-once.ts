import { useIsFocused } from 'expo-router'
import { useState } from 'react'

/** True from the screen's first focus on. NativeTabs preloads every tab, so a tab gates its content on this. */
export const useFocusedOnce = (): boolean => {
  const focused = useIsFocused()
  const [seen, setSeen] = useState(focused)
  if (focused && !seen) setSeen(true)
  return seen || focused
}
