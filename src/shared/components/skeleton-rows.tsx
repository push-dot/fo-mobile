import { View, type DimensionValue } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { LOADING_LABEL } from './constants'
import Skeleton from './skeleton'

type SkeletonRowsShape = {
  count: number
  lead?: { size: number; radius: number }
  lines: readonly { width: DimensionValue; height: number }[]
}

const SkeletonRows = ({ count, lead, lines }: SkeletonRowsShape) => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={LOADING_LABEL}>
    {Array.from({ length: count }, (_, row) => (
      <View key={row} style={styles.row}>
        {lead ? <Skeleton width={lead.size} height={lead.size} radius={lead.radius} /> : null}
        <View style={styles.lines}>
          {lines.map((line, index) => (
            <Skeleton key={index} width={line.width} height={line.height} />
          ))}
        </View>
      </View>
    ))}
  </View>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3], paddingHorizontal: theme.spacing[5], paddingVertical: theme.spacing[3] },
  lines: { flex: 1, gap: theme.spacing[2] },
}))

export type { SkeletonRowsShape }

export default SkeletonRows
