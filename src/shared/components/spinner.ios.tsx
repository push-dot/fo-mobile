import { useEffect, useState } from 'react'
import { Animated, Easing } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useColors, type Colors } from '../../theme'
import { SPINNER } from './constants'
import { useReduceMotion } from './use-reduce-motion'

const { box, radius, stroke: width } = SPINNER
const ARC = `M${box / 2} ${box / 2 - radius}a${radius} ${radius} 0 0 1 ${radius} ${radius}`

/** iOS has no native arc spinner. */
const Spinner = ({ size = SPINNER.size, color = 'acText' }: { size?: number; color?: keyof Colors }) => {
  const stroke = useColors()[color]
  const still = useReduceMotion()
  const [turn] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (still) return
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: SPINNER.turnMs, easing: Easing.linear, useNativeDriver: true }))
    loop.start()
    return () => loop.stop()
  }, [turn, still])
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${box} ${box}`}>
        <Circle cx={box / 2} cy={box / 2} r={radius} fill="none" stroke={stroke} strokeOpacity={SPINNER.trackOpacity} strokeWidth={width} />
        <Path d={ARC} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  )
}

export default Spinner
