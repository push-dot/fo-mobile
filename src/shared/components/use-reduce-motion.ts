import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

// The system answers asynchronously; the last answer is kept so a view that mounts later starts on the right value instead of
// playing its first frames as if Reduce Motion were off.
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
