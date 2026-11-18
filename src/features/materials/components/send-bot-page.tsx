import { Pressable, View } from 'react-native'
import { useBots, type Bot } from '@/features/bots'
import { Icon, Mascot, PM8, PM8_MDET_HEAD, PM8_MDET_TITLE, Sheet, SheetScroll, Text, useSheetScrollMax } from '@/shared/components'
import { radius, spacing } from '@/theme'
import { useMaterialDetail } from '../api/hooks'
import { SEND_PICK_HINT } from '../constants'
import type { MaterialKind } from '../types'
import { toAttachment } from '../utils/material-row'
import { sendToBot } from './send-material'

const PickRow = ({ bot, onPress }: { bot: Bot; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={bot.name}
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: 10, paddingHorizontal: spacing[2], borderRadius: radius.md }}
  >
    <Mascot size={40} state="idle" color={bot.kind === 'push' ? 'push' : bot.color} />
    <Text v="b1" weight="700" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
      {bot.name}
    </Text>
    <Icon name="chev" size={18} color="t3" />
  </Pressable>
)

/** BotPick: `.pick` rows (gap 12, padding 10/8, radius 16). RULINGS 53 */
export const SendBotPage = ({ kind, id }: { kind: MaterialKind; id: string }) => {
  const material = useMaterialDetail(kind, id).data?.material
  const bots = useBots().data ?? []
  const attachment = material ? toAttachment(material) : null
  const bound = useSheetScrollMax(0.75)
  return (
    <Sheet gap={PM8.gap} topGap={PM8.topGap} bottomExtra={PM8.bottomExtra} slimAction onLayout={bound.onSheetLayout}>
      <View style={{ ...PM8_MDET_HEAD, justifyContent: 'center', gap: spacing[1], paddingHorizontal: spacing[2] }}>
        <Text v="h2" weight={PM8_MDET_TITLE.weight} accessibilityRole="header" style={{ fontSize: PM8_MDET_TITLE.fontSize, lineHeight: PM8_MDET_TITLE.lineHeight }}>
          {SEND_PICK_HINT}
        </Text>
        {attachment ? (
          <Text v="b2" color="t3">
            {attachment.title}
          </Text>
        ) : null}
      </View>
      <SheetScroll style={{ maxHeight: bound.maxHeight }} onLayout={bound.onScrollLayout} contentContainerStyle={{ gap: 6 }}>
        {attachment ? bots.map((bot) => <PickRow key={bot.id} bot={bot} onPress={() => sendToBot(bot, attachment)} />) : null}
      </SheetScroll>
    </Sheet>
  )
}
