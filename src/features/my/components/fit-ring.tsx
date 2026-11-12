import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Text } from '@/shared/components'
import { type, useColors } from '../../../theme'

// The two rings the boards draw: a document row's (PushDocs, MyResume, PushDocView) and the applied job's fit card (MyAppliedJob).
const RINGS = {
  row: { size: 44, r: 18, stroke: 3.5, v: 'b2', fontSize: type.b2.fontSize },
  card: { size: 64, r: 27, stroke: 7, v: 'h2', fontSize: 22 },
} as const

const FitRing = ({ score, kind = 'row' }: { score: string; kind?: keyof typeof RINGS }) => {
  const c = useColors()
  const { size, r, stroke, v, fontSize } = RINGS[kind]
  const length = 2 * Math.PI * r
  return (
    <View accessibilityLabel={`적합도 ${score}점`} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
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
      <Text v={v} weight="800" style={{ fontSize, fontVariant: ['tabular-nums'] }}>
        {score}
      </Text>
    </View>
  )
}

export default FitRing
