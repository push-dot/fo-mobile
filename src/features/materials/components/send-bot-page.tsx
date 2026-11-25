import { Pressable, View } from 'react-native'
import { useBots, type Bot } from '@/features/bots'
import { Icon, Mascot, PM8, PM8_MDET_HEAD, PM8_MDET_TITLE, Sheet, SheetScroll, Text, useSheetScrollMax } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
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
    style={styles.row}
  >
    <Mascot size={40} state="idle" color={bot.kind === 'push' ? 'push' : bot.color} />
    <Text v="b1" weight="700" numberOfLines={1} style={styles.name}>
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
      <View style={styles.head}>
        <Text v="h2" weight={PM8_MDET_TITLE.weight} accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text v="b2" color="t3">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout} contentContainerStyle={styles.list}>
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

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: 10, paddingHorizontal: theme.spacing[2], borderRadius: theme.radius.md },
  name: { flex: 1, minWidth: 0 },
  head: { ...PM8_MDET_HEAD, justifyContent: 'center', gap: theme.spacing[1], paddingHorizontal: theme.spacing[2] },
  title: { fontSize: PM8_MDET_TITLE.fontSize, lineHeight: PM8_MDET_TITLE.lineHeight },
  scroll: (maxHeight: number) => ({ maxHeight }),
  list: { gap: 6 },
}))
