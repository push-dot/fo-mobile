import { router, useNavigation } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { useReduceMotion } from '@/shared/components'
import { CLOSE_DRAWER } from './constants'

/** Leaves a sidebar page for another screen: iOS shows the page over the open drawer, so close both first and back returns to the chat. */
export const useLeaveSidebar = () => {
  const navigation = useNavigation()
  return useCallback(
    (go: () => void) => {
      navigation.dispatch(CLOSE_DRAWER)
      router.back()
      go()
    },
    [navigation],
  )
}

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
        Animated.timing(v, { toValue: low, duration: period / 2, easing: Easing.step0, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: period / 2, easing: Easing.step0, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [active, reduce, v, period, low])
  return v
}

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
