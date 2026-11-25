import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

let current = false
const learn = (on: boolean) => {
  current = on
}
void AccessibilityInfo?.isReduceMotionEnabled?.().then(learn)
AccessibilityInfo?.addEventListener?.('reduceMotionChanged', learn)

export const useReduceMotion = () => {
  const [on, setOn] = useState(current)
  useEffect(() => {
    const set = (v: boolean) => {
      learn(v)
      setOn(v)
    }
    void AccessibilityInfo.isReduceMotionEnabled().then(set)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', set)
    return () => sub.remove()
  }, [])
  return on
}
