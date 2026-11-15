import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import { useReduceMotion } from '@/shared/components'

export const usePop = (on: boolean, duration = 200) => {
  const reduce = useReduceMotion()
  const v = useState(() => new Animated.Value(1))[0]
  const was = useRef(on)
  useEffect(() => {
    if (on && !was.current && !reduce) {
      v.setValue(0.3)
      Animated.sequence([
        Animated.timing(v, { toValue: 1.2, duration: duration * 0.6, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: duration * 0.4, useNativeDriver: true }),
      ]).start()
    }
    was.current = on
  }, [on, reduce, v, duration])
  return v
}
