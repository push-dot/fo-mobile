import { LegendList } from '@legendapp/list/react-native'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Highlight, Mascot, Text } from '@/shared/components'
import { spacing, type } from '../../../../theme'
import type { Bot, BotId, BotSearch, LocalActivity } from '../../types'
import { botRow } from '../../utils/live-state'
import { rowTime } from '../../utils/row-time'
import { searchSections } from '../../utils/home-rows'
import { LIST_BOTTOM, SEARCH_EMPTY, SEARCH_HINT, SEARCH_MESSAGE_GAP } from './copy'
import BotHomeRow from './bot-home-row'
import type { HomeChrome } from './metrics'

type Item =
  | { kind: 'title'; key: string; text: string; gap: boolean }
  | { kind: 'bot'; key: string; bot: Bot; line: string | undefined }
  | { kind: 'message'; key: string; message: BotSearch['messages'][number] }

const NO_ACTIONS: never[] = []

const SearchBotRow = ({ bot, match, activity, now, chrome, query, onOpenBot }: { bot: Bot; match: string | undefined; activity: LocalActivity | undefined; now: Date; chrome: HomeChrome; query: string; onOpenBot: (bot: Bot) => void }) => (
  <BotHomeRow row={botRow(bot, activity, now, match)} chrome={chrome} index={0} held={false} query={query} actions={NO_ACTIONS} onPress={() => onOpenBot(bot)} />
)

const BotHomeSearch = ({
  query,
  hint,
  data,
  pending,
  local,
  now,
  chrome,
  top,
  bottom,
  bots,
  onOpenBot,
  onOpenMessage,
}: {
  query: string
  hint: boolean
  data: BotSearch | undefined
  pending: boolean
  local: Readonly<Record<string, LocalActivity | undefined>>
  now: Date
  chrome: HomeChrome
  top: number
  bottom: number
  bots: readonly Bot[]
  onOpenBot: (bot: Bot) => void
  onOpenMessage: (botId: BotId, messageId: string) => void
}) => {
  const trimmed = query.trim()
  const empty = !hint && !pending && !!data && data.bots.length === 0 && data.messages.length === 0
  const { bots: botTitle, messages: messageTitle } = data && !hint ? searchSections(data.bots.length > 0 ? data.botTotal : 0, data.messages.length > 0 ? data.messageTotal : 0) : {}
  const centred = hint || empty
  const pad = {
    paddingTop: top,
    paddingBottom: centred ? bottom : Math.max(LIST_BOTTOM, bottom + SEARCH_MESSAGE_GAP),
    flexGrow: centred ? 1 : 0,
    justifyContent: centred ? ('center' as const) : ('flex-start' as const),
  }
  const center = { textAlign: 'center' as const, fontSize: type.b2.fontSize, lineHeight: type.b2.lineHeight, paddingHorizontal: spacing[6] }
  const sect = { fontSize: chrome.sectSize, lineHeight: chrome.sectLine, paddingTop: 6, paddingBottom: spacing[1], paddingHorizontal: spacing[5] }
  const hit = {
    flexDirection: 'row' as const,
    alignItems: chrome.rowAlign,
    gap: chrome.rowGap,
    paddingVertical: chrome.rowPadV,
    paddingHorizontal: chrome.rowPadH,
    minHeight: 76,
  }
  const body = { flex: 1, minWidth: 0, gap: 3 }
  const topRow = { flexDirection: 'row' as const, alignItems: chrome.rowAlign, gap: chrome.nameGap }
  const name = { flex: 1, fontSize: chrome.nameSize, lineHeight: chrome.nameLine }
  const time = { fontSize: chrome.timeSize, lineHeight: chrome.timeLine }
  const line = { fontSize: chrome.msgSize, lineHeight: chrome.msgLine }
  const items: Item[] = !data || hint ? [] : [
      ...(botTitle ? [{ kind: 'title', key: 'title:bots', text: botTitle, gap: false } as Item] : []),
      ...data.bots.map(({ bot, line: match }): Item => ({ kind: 'bot', key: `bot:${bot.id}`, bot, line: match })),
      ...(messageTitle ? [{ kind: 'title', key: 'title:messages', text: messageTitle, gap: !!botTitle } as Item] : []),
      ...data.messages.map((message): Item => ({ kind: 'message', key: `message:${message.messageId}`, message })),
  ]
  const renderItem = ({ item }: { item: Item }) => {
    if (item.kind === 'title') {
      return (
        <Text allowFontScaling={chrome.noScale} weight="700" color="t3" style={item.gap ? [sect, { paddingTop: 14 }] : sect}>
          {item.text}
        </Text>
      )
    }
    if (item.kind === 'bot') {
      return <SearchBotRow bot={item.bot} match={item.line} activity={local[item.bot.id]} now={now} chrome={chrome} query={trimmed} onOpenBot={onOpenBot} />
    }
    const { message } = item
    const when = rowTime(message.at, now)
    const label = `${message.bot.name} Bot, ${message.snippet}, ${when}`
    const found = bots.find((bot) => bot.id === message.bot.id)
    const done = found ? botRow(found, local[found.id], now).mascot === 'done' : false
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => onOpenMessage(message.bot.id, message.messageId)}>
        <View style={hit}>
          <View style={styles.mascot(chrome.mascotTop)}>
            <Mascot key={item.key} size={chrome.rowMascot} state={done ? 'done' : 'idle'} color={message.bot.color ?? 'push'} motion={{ mode: done ? 'animate' : 'still' }} />
          </View>
          <View style={body}>
            <View style={topRow}>
              <Text allowFontScaling={chrome.noScale} weight="700" numberOfLines={chrome.nameLines} style={name}>
                <Highlight text={message.bot.name} q={trimmed} />
              </Text>
              <Text allowFontScaling={chrome.noScale} color="t3" style={time}>
                {when}
              </Text>
            </View>
            <Text allowFontScaling={chrome.noScale} color="t3" numberOfLines={chrome.msgLines} style={line}>
              <Highlight text={message.snippet} q={trimmed} />
            </Text>
          </View>
        </View>
      </Pressable>
    )
  }
  return (
    <LegendList
      data={items}
      keyExtractor={(item) => item.key}
      getItemType={(item) => item.kind}
      renderItem={renderItem}
      recycleItems
      estimatedItemSize={80}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={pad}
      ListEmptyComponent={
        hint || empty ? (
          <Text allowFontScaling={chrome.noScale} color="t3" style={center}>
            {hint ? SEARCH_HINT : SEARCH_EMPTY}
          </Text>
        ) : null
      }
    />
  )
}

const styles = StyleSheet.create(() => ({
  mascot: (marginTop: number) => ({ marginTop }),
}))

export default BotHomeSearch
