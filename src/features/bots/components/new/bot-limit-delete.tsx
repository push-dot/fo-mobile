import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/shared/components'
import { platformTheme, spacing, useColors } from '@/theme'
import { MASCOT_PALETTES } from '@/theme/mascot'
import type { CompanyBot } from '../../types'
import { rowTime } from '../../utils/row-time'
import { DELETE_HINT, DELETE_LABEL } from './copy'

const TILE = 50
const ROW = 76

/** BotNewLimitDelete: the page the limit state's 삭제하기 opens. One row per company Bot with its own 삭제. */
const BotLimitDelete = ({ bots, onDelete }: { bots: readonly CompanyBot[]; onDelete: (bot: CompanyBot) => void }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const now = new Date()
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + spacing[6] }}>
      <Text v="b2" color="t3" style={{ paddingTop: spacing[3], paddingBottom: spacing[3] }}>
        {DELETE_HINT}
      </Text>
      {bots.map((bot) => (
        <View key={bot.id} style={{ minHeight: ROW, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <View style={{ width: TILE, height: TILE, borderRadius: 14, backgroundColor: MASCOT_PALETTES[bot.color].body }} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text v="b1" weight="700" numberOfLines={1}>
              {bot.name}
            </Text>
            <Text v="c1" color="t3" numberOfLines={1}>
              {rowTime(bot.lastActivityAt, now)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${bot.name} ${DELETE_LABEL}`}
            onPress={() => onDelete(bot)}
            style={{ minHeight: 40, minWidth: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: platformTheme.buttonSmRadius, backgroundColor: c.fill }}
          >
            <Text v="c1" weight="700" color="red">
              {DELETE_LABEL}
            </Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  )
}

export default BotLimitDelete
