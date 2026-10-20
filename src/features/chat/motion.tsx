import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native'

// Motion values from feature-spec 15.4. Reduce Motion → fades only, no loops.
export const SPRING = Easing.bezier(0.2, 0.9, 0.25, 1)
export const BUBBLE = Easing.bezier(0.2, 0.9, 0.25, 1.15)

export const useReduceMotion = () => {
  const [on, setOn] = useState(false)
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setOn)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn)
    return () => sub.remove()
  }, [])
  return on
}

type AppearProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** 'up' = fade + rise 10px (300ms), 'bubble' = rise 18px + scale .94 from the bottom-right (400ms). */
  kind?: 'up' | 'bubble' | 'fade'
  delay?: number
  duration?: number
}

/** Plays once on mount. */
export function Appear({ children, style, kind = 'up', delay = 0, duration }: AppearProps) {
  const reduce = useReduceMotion()
  const v = useState(() => new Animated.Value(0))[0]
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      delay,
      duration: duration ?? (kind === 'bubble' ? 400 : kind === 'fade' ? 250 : 300),
      easing: kind === 'bubble' ? BUBBLE : Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [v, delay, duration, kind])
  const move = !reduce && kind !== 'fade'
  const dy = kind === 'bubble' ? 18 : 10
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: move
            ? [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) },
                ...(kind === 'bubble' ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] : []),
              ]
            : [],
          transformOrigin: kind === 'bubble' ? 'right bottom' : undefined,
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

/** Looping opacity 1 → low → 1 (running dots, shimmer stand-in). Stops under Reduce Motion. */
export function usePulse(active: boolean, period = 1000, low = 0.25) {
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
export function usePop(on: boolean, duration = 350) {
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
