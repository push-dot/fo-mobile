import { View } from 'react-native'
import { Skeleton } from '@/shared/components'
import { spacing } from '../../../../theme'
import { LOADING_LABEL } from './copy'
import type { HomeChrome } from './metrics'

const ROWS: ReadonlyArray<readonly [number, number?]> = [[96, 210], [120, 180], [80, 230], [110, 160], [90, 200], [130]]

const BotHomeLoading = ({ chrome, top }: { chrome: HomeChrome; top: number }) => {
  const wrap = { paddingTop: top }
  const hero = { alignItems: 'center' as const, gap: 10, paddingTop: 2, paddingBottom: 14 }
  const row = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14, paddingHorizontal: spacing[5], paddingVertical: 10, minHeight: 76 }
  const lines = { flex: 1, gap: spacing[2] }
  const caption = { marginTop: 6 }
  return (
    <View accessibilityLabel={LOADING_LABEL} style={wrap}>
      <View style={hero}>
        <Skeleton width={chrome.hero} height={chrome.hero} radius={34} />
        <View style={caption}>
          <Skeleton width={72} height={16} />
        </View>
      </View>
      {ROWS.map(([name, line], key) => (
        <View key={key} style={row}>
          <Skeleton width={52} height={52} radius={18} />
          <View style={lines}>
            <Skeleton width={name} height={14} />
            {line ? <Skeleton width={line} height={12} /> : null}
          </View>
        </View>
      ))}
    </View>
  )
}

export default BotHomeLoading
