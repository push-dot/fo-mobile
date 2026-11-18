import { Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mascot, Text } from '@/shared/components'
import { platformTheme, spacing, useColors } from '@/theme'
import { MASCOT_PALETTES } from '@/theme/mascot'
import { useBotProfile } from '../../api/hooks'
import type { CompanyBot } from '../../types'
import { limitRowMeta } from '../../utils/limit-row'
import { rowTime } from '../../utils/row-time'
import { DELETE_HINT, DELETE_LABEL } from './copy'

const TILE = 44
// BotNewLimitDelete: Android draws a flat 44pt square of the bot's colour (radius 12) where iOS draws the mascot.
const ANDROID_TILE_RADIUS = 12
const SECTION_GAP = 20

const LimitRow = ({ bot, now, onDelete }: { bot: CompanyBot; now: Date; onDelete: (bot: CompanyBot) => void }) => {
  const c = useColors()
  // The list answer has no posting, so each row asks for the bot's profile (cached by the bot profile screen too).
  const title = useBotProfile(bot.id).data?.posting?.title
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: spacing[3] }}>
      {Platform.OS === 'android' ? (
        <View style={{ width: TILE, height: TILE, borderRadius: ANDROID_TILE_RADIUS, backgroundColor: MASCOT_PALETTES[bot.color].body }} />
      ) : (
        <Mascot size={TILE} color={bot.color} motion={{ mode: 'still' }} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="600" numberOfLines={1}>
          {bot.name}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {limitRowMeta(title, rowTime(bot.lastActivityAt, now))}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${bot.name} ${DELETE_LABEL}`}
        onPress={() => onDelete(bot)}
        style={{ height: 36, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: platformTheme.buttonSmRadius, backgroundColor: c.fill }}
      >
        <Text v="b2" weight="600" color="red">
          {DELETE_LABEL}
        </Text>
      </Pressable>
    </View>
  )
}

/** BotNewLimitDelete: the page the limit state's 삭제하기 opens. One row per company Bot with its own 삭제. */
const BotLimitDelete = ({ bots, onDelete }: { bots: readonly CompanyBot[]; onDelete: (bot: CompanyBot) => void }) => {
  const insets = useSafeAreaInsets()
  const now = new Date()
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: SECTION_GAP, paddingTop: spacing[2], paddingHorizontal: spacing[5], paddingBottom: insets.bottom + spacing[6] }}>
      <Text v="b2" color="t3" style={{ paddingTop: spacing[1], paddingBottom: spacing[2] }}>
        {DELETE_HINT}
      </Text>
      {bots.map((bot) => (
        <LimitRow key={bot.id} bot={bot} now={now} onDelete={onDelete} />
      ))}
    </ScrollView>
  )
}

export default BotLimitDelete
