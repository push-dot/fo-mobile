import { Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mascot, Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { MASCOT_PALETTES } from '@/theme/mascot'
import { useBotProfile } from '../../api/hooks'
import type { CompanyBot } from '../../types'
import { limitRowMeta } from '../../utils/limit-row'
import { rowTime } from '../../utils/row-time'
import { DELETE_HINT, DELETE_LABEL } from './copy'

const TILE = 44
const ANDROID_TILE_RADIUS = 12
const SECTION_GAP = 20

const LimitRow = ({ bot, now, onDelete }: { bot: CompanyBot; now: Date; onDelete: (bot: CompanyBot) => void }) => {
  const title = useBotProfile(bot.id).data?.posting?.title
  return (
    <View style={styles.row}>
      {Platform.OS === 'android' ? (
        <View style={styles.tile(bot.color)} />
      ) : (
        <Mascot size={TILE} color={bot.color} motion={{ mode: 'still' }} />
      )}
      <View style={styles.body}>
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
        style={styles.delete}
      >
        <Text v="b2" weight="600" color="red">
          {DELETE_LABEL}
        </Text>
      </Pressable>
    </View>
  )
}

const BotLimitDelete = ({ bots, onDelete }: { bots: readonly CompanyBot[]; onDelete: (bot: CompanyBot) => void }) => {
  const insets = useSafeAreaInsets()
  const now = new Date()
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content(insets.bottom)}>
      <Text v="b2" color="t3" style={styles.hint}>
        {DELETE_HINT}
      </Text>
      {bots.map((bot) => (
        <LimitRow key={bot.id} bot={bot} now={now} onDelete={onDelete} />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: theme.spacing[3] },
  tile: (color: CompanyBot['color']) => ({ width: TILE, height: TILE, borderRadius: ANDROID_TILE_RADIUS, backgroundColor: MASCOT_PALETTES[color].body }),
  body: { flex: 1, minWidth: 0 },
  delete: { height: 36, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: theme.platform.buttonSmRadius, backgroundColor: theme.colors.fill },
  scroll: { flex: 1 },
  content: (insetBottom: number) => ({ gap: SECTION_GAP, paddingTop: theme.spacing[2], paddingHorizontal: theme.spacing[5], paddingBottom: insetBottom + theme.spacing[6] }),
  hint: { paddingTop: theme.spacing[1], paddingBottom: theme.spacing[2] },
}))

export default BotLimitDelete
