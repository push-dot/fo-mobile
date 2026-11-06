import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

export const useReduceMotion = () => {
  const [on, setOn] = useState(false)
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setOn)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn)
    return () => sub.remove()
  }, [])
  return on
}
