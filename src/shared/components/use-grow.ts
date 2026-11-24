import { useEffect, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { useReduceMotion } from './use-reduce-motion'

/** The boards' `grow` bar fill: 0 to 1 over 900 ms (cubic-bezier .2,.8,.2,1) after `delay`; Reduce Motion starts full. */
export const useGrow = (delay = 0) => {
  const reduce = useReduceMotion()
  const grow = useState(() => new Animated.Value(reduce ? 1 : 0))[0]
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: reduce ? 0 : 900, delay, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start()
  }, [grow, reduce, delay])
  return grow
}
