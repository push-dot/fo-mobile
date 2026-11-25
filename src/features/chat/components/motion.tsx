import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native'
import { BUBBLE } from '../constants'
import { appearFrom, appearMoves, appearMs, playAppear, type AppearKind } from './appear'
import { useReduceMotion } from '@/shared/components'

export const RowMotion = createContext<{ key: string; live: boolean } | null>(null)
const played = new Set<string>()

type AppearProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  kind?: AppearKind
  delay?: number
  duration?: number
}

export const Appear = ({ children, style, kind = 'up', delay = 0, duration }: AppearProps) => {
  const reduce = useReduceMotion()
  const row = useContext(RowMotion)
  const rowKey = row?.key
  const [still] = useState(() => !!row && (!row.live || played.has(row.key)))
  const v = useState(() => new Animated.Value(still ? 1 : 0))[0]
  useEffect(() => {
    if (rowKey) played.add(rowKey)
    return playAppear(v, { still, reduce }, () => {
      const timing = Animated.timing(v, {
        toValue: 1,
        delay,
        duration: appearMs(kind, duration),
        easing: kind === 'bubble' ? Easing.bezier(...BUBBLE) : Easing.out(Easing.ease),
        useNativeDriver: true,
      })
      timing.start()
      return timing
    })
  }, [v, delay, duration, kind, still, rowKey, reduce])
  const from = appearFrom(kind)
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: appearMoves(kind, still)
            ? [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from.dy, 0] }) },
                ...(kind === 'bubble' ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from.scale, 1] }) }] : []),
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
