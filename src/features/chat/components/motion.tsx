import { useEffect, useState, type ReactNode } from 'react'
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native'
import { BUBBLE } from '../constants'
import { useReduceMotion } from '../hooks'

type AppearProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** 'up' = fade + rise 10px (300ms), 'bubble' = rise 18px + scale .94 from the bottom-right (400ms). */
  kind?: 'up' | 'bubble' | 'fade'
  delay?: number
  duration?: number
}

/** Plays once on mount. */
export const Appear = ({ children, style, kind = 'up', delay = 0, duration }: AppearProps) => {
  const reduce = useReduceMotion()
  const v = useState(() => new Animated.Value(0))[0]
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      delay,
      duration: duration ?? (kind === 'bubble' ? 400 : kind === 'fade' ? 250 : 300),
      easing: kind === 'bubble' ? Easing.bezier(...BUBBLE) : Easing.out(Easing.ease),
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
