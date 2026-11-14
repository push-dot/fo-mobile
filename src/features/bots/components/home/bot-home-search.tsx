import { Pressable, ScrollView, View } from 'react-native'
import { Highlight, Mascot, Text } from '@/shared/components'
import { spacing, type } from '../../../../theme'
import type { Bot, BotSearch, LocalActivity } from '../../types'
import { botRow } from '../../utils/live-state'
import { rowTime } from '../../utils/row-time'
import { searchSections } from '../../utils/home-rows'
import { LIST_BOTTOM, SEARCH_EMPTY, SEARCH_HINT, SEARCH_MESSAGE_GAP } from './copy'
import BotHomeRow from './bot-home-row'
import type { HomeChrome } from './metrics'

const BotHomeSearch = ({
  query,
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
  data: BotSearch | undefined
  pending: boolean
  local: Readonly<Record<string, LocalActivity | undefined>>
  now: Date
  chrome: HomeChrome
  top: number
  /** Where the search bar's top edge is: the hint and the empty line centre between `top` and this. */
  bottom: number
  bots: readonly Bot[]
  onOpenBot: (bot: Bot) => void
  onOpenMessage: (botId: string, messageId: string) => void
}) => {
  const trimmed = query.trim()
  const hint = trimmed === ''
  const empty = !hint && !pending && !!data && data.bots.length === 0 && data.messages.length === 0
  const titles = data && !hint ? searchSections(data.bots.length > 0 ? data.botTotal : 0, data.messages.length > 0 ? data.messageTotal : 0) : []
  const botTitle = titles.find((title) => title.startsWith('Bot'))
  const messageTitle = titles.find((title) => title.startsWith('대화'))
  const centred = hint || empty
  const pad = {
    // AgentHomeSearchEmpty: the line centres between the status bar and the search bar, 16pt above it.
    paddingTop: centred ? top - spacing[2] : top,
    paddingBottom: centred ? bottom + SEARCH_MESSAGE_GAP : Math.max(LIST_BOTTOM, bottom + SEARCH_MESSAGE_GAP),
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
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={pad}>
      {hint ? (
        <Text color="t3" style={center}>
          {SEARCH_HINT}
        </Text>
      ) : null}
      {empty ? (
        <Text color="t3" style={center}>
          {SEARCH_EMPTY}
        </Text>
      ) : null}
      {botTitle ? (
        <Text weight="700" color="t3" style={sect}>
          {botTitle}
        </Text>
      ) : null}
      {data && !hint
        ? data.bots.map(({ bot, line: match }) => {
            const row = botRow(bot, local[bot.id], now, match)
            return <BotHomeRow key={bot.id} row={row} chrome={chrome} index={0} held={false} query={trimmed} actions={[]} onPress={() => onOpenBot(bot)} />
          })
        : null}
      {messageTitle ? (
        <Text weight="700" color="t3" style={botTitle ? [sect, { paddingTop: 14 }] : sect}>
          {messageTitle}
        </Text>
      ) : null}
      {data && !hint
        ? data.messages.map((message) => {
            const when = rowTime(message.at, now)
            const label = `${message.bot.name} Bot, ${message.snippet}, ${when}`
            // AgentHomeSearch draws the Push Bot hit with the sparkles of its unread 완료; a bot still running shows no state here.
            const found = bots.find((bot) => bot.id === message.bot.id)
            const done = found ? botRow(found, local[found.id], now).mascot === 'done' : false
            return (
              <Pressable key={message.messageId} accessibilityRole="button" accessibilityLabel={label} onPress={() => onOpenMessage(message.bot.id, message.messageId)}>
                <View style={hit}>
                  <View style={{ marginTop: chrome.mascotTop }}>
                    <Mascot size={chrome.rowMascot} state={done ? 'done' : 'idle'} color={message.bot.color ?? 'push'} motion={{ mode: done ? 'frame3' : 'still' }} />
                  </View>
                  <View style={body}>
                    <View style={topRow}>
                      <Text weight="700" numberOfLines={chrome.nameLines} style={name}>
                        <Highlight text={message.bot.name} q={trimmed} />
                      </Text>
                      <Text color="t3" style={time}>
                        {when}
                      </Text>
                    </View>
                    <Text color="t3" numberOfLines={chrome.msgLines} style={line}>
                      <Highlight text={message.snippet} q={trimmed} />
                    </Text>
                  </View>
                </View>
              </Pressable>
            )
          })
        : null}
    </ScrollView>
  )
}

export default BotHomeSearch
