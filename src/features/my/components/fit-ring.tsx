import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Text } from '@/shared/components'
import { useColors } from '../../../theme'

const FitRing = ({ score, size = 44 }: { score: string; size?: number }) => {
  const c = useColors()
  const stroke = Math.max(3, Math.round(size / 14))
  const r = (size - stroke) / 2
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
      <Text v={size >= 56 ? 'h3' : 'b2'} weight="800">
        {score}
      </Text>
    </View>
  )
}

export default FitRing
