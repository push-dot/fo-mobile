import { useEffect, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Svg, { Circle } from 'react-native-svg'
import { useColors } from '../../theme'

const SIZE = 32
const STROKE = 4
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

const LoadingIndicator = () => {
  const c = useColors()
  const [turn] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }))
    loop.start()
    return () => loop.stop()
  }, [turn])
  const spin = { transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }
  return (
    <Animated.View style={[styles.box, spin]}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={c.fill2} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={c.ac}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC * 0.28} ${CIRC}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create(() => ({
  box: { width: SIZE, height: SIZE },
}))

export default LoadingIndicator
