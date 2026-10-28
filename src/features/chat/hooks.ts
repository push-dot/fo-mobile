import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing } from 'react-native'

export const useReduceMotion = () => {
  const [on, setOn] = useState(false)
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setOn)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn)
    return () => sub.remove()
  }, [])
  return on
}

/** Looping opacity 1 → low → 1 (running dots, shimmer stand-in). Stops under Reduce Motion. */
export const usePulse = (active: boolean, period = 1000, low = 0.25) => {
  const reduce = useReduceMotion()
  const v = useState(() => new Animated.Value(1))[0]
  useEffect(() => {
    if (!active || reduce) {
      v.setValue(1)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: low, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [active, reduce, v, period, low])
  return v
}

/** Scale pop 0.3 → 1.2 → 1 when `on` flips true (todo check 350ms, tool done 300ms). */
export const usePop = (on: boolean, duration = 350) => {
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
