import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useBots, type Bot } from '@/features/bots'
import { PM8, PM8_MDET_HEAD, PM8_MDET_TITLE, Sheet, SheetScroll, Text, useSheetScrollMax } from '@/shared/components'
import BotPickRow from './bot-pick-row'

const BotPickSheet = ({ title, subtitle, onPick }: { title: string; subtitle?: string; onPick: ((bot: Bot) => void) | null }) => {
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
        {onPick ? bots.map((bot) => <BotPickRow key={bot.id} bot={bot} onPress={() => onPick(bot)} />) : null}
      </SheetScroll>
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: { ...PM8_MDET_HEAD, justifyContent: 'center', gap: theme.spacing[1], paddingHorizontal: theme.spacing[2] },
  title: { fontSize: PM8_MDET_TITLE.fontSize, lineHeight: PM8_MDET_TITLE.lineHeight },
  scroll: (maxHeight: number) => ({ maxHeight }),
  list: { gap: 6 },
}))

export default BotPickSheet
