import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { type, useColors } from '../../../theme'

const RINGS = {
  row: { size: 44, r: 18, stroke: 3.5, v: 'b2', fontSize: type.b2.fontSize, lineHeight: 20 },
  card: { size: 64, r: 27, stroke: 7, v: 'h2', fontSize: 22, lineHeight: type.h2.lineHeight },
} as const

const FitRing = ({ score, kind = 'row' }: { score: string; kind?: keyof typeof RINGS }) => {
  const c = useColors()
  const { size, r, stroke, v, fontSize, lineHeight } = RINGS[kind]
  const length = 2 * Math.PI * r
  return (
    <View accessibilityLabel={`적합도 ${score}점`} style={styles.ring(size)}>
      <Svg width={size} height={size} style={styles.track}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.fill2} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.ac}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(Number(score) / 10) * length} ${length}`}
          fill="none"
        />
      </Svg>
      <Text v={v} weight="800" style={styles.score(fontSize, lineHeight)}>
        {score}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  ring: (size: number) => ({ width: size, height: size, alignItems: 'center', justifyContent: 'center' }),
  track: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  score: (fontSize: number, lineHeight: number) => ({ fontSize, lineHeight, fontVariant: ['tabular-nums'] }),
})

export default FitRing
