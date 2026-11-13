import { View } from 'react-native'
import { Skeleton } from '@/shared/components'
import { spacing } from '../../../../theme'
import { LOADING_LABEL } from './copy'
import type { HomeChrome } from './metrics'

const BotHomeLoading = ({ chrome, top }: { chrome: HomeChrome; top: number }) => {
  const wrap = { paddingTop: top, gap: spacing[2] }
  const hero = { alignItems: 'center' as const, gap: 10, paddingTop: 2, paddingBottom: 14 }
  const row = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14, paddingHorizontal: spacing[5], paddingVertical: 10 }
  const lines = { flex: 1, gap: spacing[2] }
  return (
    <View accessibilityLabel={LOADING_LABEL} style={wrap}>
      <View style={hero}>
        <Skeleton width={chrome.hero} height={chrome.hero} radius={34} />
        <Skeleton width={72} height={16} />
      </View>
      {[0, 1, 2, 3].map((key) => (
        <View key={key} style={row}>
          <Skeleton width={52} height={52} radius={18} />
          <View style={lines}>
            <Skeleton width={96} height={14} />
            <Skeleton width={180} height={12} />
          </View>
        </View>
      ))}
    </View>
  )
}

export default BotHomeLoading
