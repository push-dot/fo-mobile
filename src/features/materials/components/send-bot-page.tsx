import { Pressable, View } from 'react-native'
import { useBots, type Bot } from '@/features/bots'
import { Icon, Mascot, PM8, PM8_MDET_HEAD, PM8_MDET_TITLE, Sheet, SheetScroll, Text, useSheetScrollMax } from '@/shared/components'
import { radius, spacing } from '@/theme'
import { useMaterialDetail } from '../api/hooks'
import { SEND_PICK_HINT } from '../constants'
import type { MaterialKind } from '../types'
import { toAttachment } from '../utils/material-row'
import { sendToBot } from './send-material'

export const PickRow = ({ bot, onPress }: { bot: Bot; onPress: () => void }) => (
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

export const BotPickSheet = ({ title, subtitle, onPick }: { title: string; subtitle?: string; onPick: ((bot: Bot) => void) | null }) => {
  const bots = useBots().data ?? []
  const bound = useSheetScrollMax()
  return (
    <Sheet gap={PM8.gap} topGap={PM8.topGap} bottomExtra={PM8.bottomExtra} slimAction onLayout={bound.onSheetLayout}>
      <View style={{ ...PM8_MDET_HEAD, justifyContent: 'center', gap: spacing[1], paddingHorizontal: spacing[2] }}>
        <Text v="h2" weight={PM8_MDET_TITLE.weight} accessibilityRole="header" style={{ fontSize: PM8_MDET_TITLE.fontSize, lineHeight: PM8_MDET_TITLE.lineHeight }}>
          {title}
        </Text>
        {subtitle ? (
          <Text v="b2" color="t3">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <SheetScroll style={{ maxHeight: bound.maxHeight }} onLayout={bound.onScrollLayout} contentContainerStyle={{ gap: 6 }}>
        {onPick ? bots.map((bot) => <PickRow key={bot.id} bot={bot} onPress={() => onPick(bot)} />) : null}
      </SheetScroll>
    </Sheet>
  )
}

export const SendBotPage = ({ kind, id }: { kind: MaterialKind; id: string }) => {
  const material = useMaterialDetail(kind, id).data?.material
  const attachment = material ? toAttachment(material) : null
  return <BotPickSheet title={SEND_PICK_HINT} subtitle={attachment?.title} onPick={attachment ? (bot) => sendToBot(bot, attachment) : null} />
}
