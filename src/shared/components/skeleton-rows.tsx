import { View, type DimensionValue } from 'react-native'
import { spacing } from '../../theme'
import { LOADING_LABEL } from './constants'
import Skeleton from './skeleton'

export type SkeletonRowsShape = {
  count: number
  lead: { size: number; radius: number }
  lines: readonly { width: DimensionValue; height: number }[]
}

const SkeletonRows = ({ count, lead, lines }: SkeletonRowsShape) => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={LOADING_LABEL}>
    {Array.from({ length: count }, (_, row) => (
      <View key={row} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], paddingHorizontal: spacing[5], paddingVertical: spacing[3] }}>
        <Skeleton width={lead.size} height={lead.size} radius={lead.radius} />
        <View style={{ flex: 1, gap: spacing[2] }}>
          {lines.map((line, index) => (
            <Skeleton key={index} width={line.width} height={line.height} />
          ))}
        </View>
      </View>
    ))}
  </View>
)

export default SkeletonRows
