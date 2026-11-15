import { router } from 'expo-router'
import { useContext } from 'react'
import { Pressable, View, useWindowDimensions } from 'react-native'
import { materialDetailPath } from '@/features/bots'
import { Text } from '@/shared/components'
import { useXlBoardText, XL_CHAT_TRACKING } from '@/shared/components/xl-chrome'
import { displayName } from '@/shared/utility/display-name'
import { radius, spacing, useColors } from '../../../../theme'
import type { ChatItem, PlanItem } from '../../types'
import { splitBotText, type BotTextBlock } from '../../utils/bot-text'
import { hitsBefore } from '../../utils/find'
import { diffLinesDetail } from '../../utils/bubble-detail'
import { blueprintList, isBlueprints, planKeywords, planTable } from '../../utils/plan-table'
import { Appear } from '../motion'
import { FindHighlight, FindText, Marked } from '../header/highlight'
import Detail from './detail'
import MdTable from './md-table'
import ResultLine from './result-line'
import Rich, { plainOf } from './rich'

// ChatBotHeaderXL draws a bot line at 21 over 31 (.msg under .xl): the system scale of 16 came out 5 % smaller, so XL sets the size itself.
const XL_LINE = { fontSize: 21, lineHeight: 31, letterSpacing: XL_CHAT_TRACKING }

/** The widest a bot bubble gets: 88 % of the thread. A number, because Yoga measures the text of a shrink-wrapped box against the thread, not against the box's own maxWidth, and the text ran into the bubble's padding (ChatResume). */
export const useBotBubbleMax = () => (useWindowDimensions().width - spacing[5] * 2) * 0.88
const BUBBLE_PAD_X = 15
const BULLET_DOT = 6
const BULLET_GAP = 10
// The list's own indent, the dot and the gap before a bullet's text.
const BULLET_LEAD = spacing[1] + BULLET_DOT + BULLET_GAP
/** What a table can fill inside a bot bubble that is at its widest. */
const useTableWidth = () => useBotBubbleMax() - BUBBLE_PAD_X * 2

/** The bot's bubble: everything the bot says or shows in one step lives inside one of these (rule 30). */
export const Bubble = ({ children, gap = 6, wide }: { children: React.ReactNode; gap?: number; wide?: boolean }) => {
  const c = useColors()
  const maxWidth = useBotBubbleMax()
  return (
    // With a card inside, the board's box fills its max width (the card's rows wrap), and the gap to the card is 10.
    <Appear kind="bubble" style={{ alignSelf: 'flex-start', maxWidth, ...(wide ? { width: maxWidth } : null) }}>
      <View style={{ maxWidth, gap, paddingVertical: 11, paddingHorizontal: BUBBLE_PAD_X, borderRadius: radius.lg, borderBottomLeftRadius: radius.xs, backgroundColor: c.fill }}>
        {children}
      </View>
    </Appear>
  )
}

/** `ul.mdul`: a marked list in the bot's bubble (ChatPh3Review, ChatPh3Boost, ChatPh4Quality). */
export const BulletList = ({ items, markId, hitsBefore }: { items: string[]; markId: string; hitsBefore?: number[] }) => {
  const c = useColors()
  // A row's text is measured against the row's width before the dot and the gap are taken off, then shrunk without a re-wrap, so its lines ran into the bubble's padding:
  // the number it may use is given to it.
  const textMax = useBotBubbleMax() - BUBBLE_PAD_X * 2 - BULLET_LEAD
  return (
    <View style={{ gap: 2 }}>
      {items.map((line, i) => (
        <View key={line} style={{ flexDirection: 'row', gap: BULLET_GAP, paddingLeft: spacing[1] }}>
          <View style={{ width: BULLET_DOT, height: BULLET_DOT, borderRadius: BULLET_DOT / 2, marginTop: 9, backgroundColor: c.t1 }} />
          <Rich v="b1" text={line} markId={markId} hitsBefore={hitsBefore?.[i]} style={{ flexShrink: 1, maxWidth: textMax }} />
        </View>
      ))}
    </View>
  )
}

/** A plan or feedback inside the bot's bubble: the table, then its keywords as grey sub-text. */
export const PlanBlock = ({ item }: { item: PlanItem }) => {
  const tableWidth = useTableWidth()
  if (isBlueprints(item)) {
    const { lines, detail } = blueprintList(item)
    return (
      <>
        <View style={{ gap: spacing[1] }}>
          {lines.map((line) => (
            <Text key={line} v="b1">
              {line}
            </Text>
          ))}
        </View>
        <Detail text={detail.text} more={detail.more} />
      </>
    )
  }
  const keywords = planKeywords(item)
  return (
    <>
      <MdTable table={planTable(item)} width={tableWidth} />
      {keywords ? <Detail text={keywords.text} more={keywords.more} /> : null}
    </>
  )
}

const DiffDetail = ({ item }: { item: Extract<ChatItem, { type: 'diff' }> }) => {
  const view = diffLinesDetail(item.lines)
  return <Detail text={view.text} more={view.more} />
}

/** The lines of a block that draw find marks, in render order (an ordered list draws its numbers). */
const markedLines = (block: BotTextBlock): string[] =>
  block.kind === 'paragraph' || block.kind === 'heading' ? [block.text] : block.kind === 'ordered' ? block.items.map((line, n) => `${n + 1}. ${line}`) : block.kind === 'bullets' || block.kind === 'list' ? block.items : []

const BotText = ({ item, onView }: { item: Extract<ChatItem, { type: 'agentText' }>; onView?: (card: Extract<ChatItem, { type: 'result' }>) => void }) => {
  const c = useColors()
  const tableWidth = useTableWidth()
  const xl = useXlBoardText()
  const big = xl ? { style: XL_LINE, allowFontScaling: false } : null
  const { query } = useContext(FindHighlight)
  // 채팅에서 찾기: the hits the lines above one hold, so the line with the current hit is the one drawn as current.
  const blocks = splitBotText(item.text)
  const lines = blocks.flatMap(markedLines)
  const above = hitsBefore(lines.map(plainOf), query)
  const first = blocks.map((_, i) => blocks.slice(0, i).reduce((sum, b) => sum + markedLines(b).length, 0))
  return (
    <Bubble gap={item.card ? 10 : 6} wide={!!item.card}>
      {blocks.map((block, i) =>
        block.kind === 'paragraph' ? (
          <Rich key={i} v="b1" text={block.text} markId={item.id} hitsBefore={above[first[i]!]} {...big} />
        ) : block.kind === 'heading' ? (
          <Rich key={i} v={block.level === 1 ? 'h3' : 'b2'} weight={block.level === 1 ? '700' : '600'} style={block.level === 1 ? undefined : { marginTop: spacing[1] }} text={block.text} markId={item.id} hitsBefore={above[first[i]!]} />
        ) : block.kind === 'sub' ? (
          <Pressable key={i} accessibilityRole={block.route ? 'link' : 'text'} disabled={!block.route} onPress={() => router.push(block.route as never)}>
            <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20 }}>
              {block.text}
            </Text>
          </Pressable>
        ) : block.kind === 'table' ? (
          <MdTable key={i} table={block} width={tableWidth} />
        ) : block.kind === 'bullets' ? (
          <BulletList key={i} items={block.items} markId={item.id} hitsBefore={block.items.map((_, n) => above[first[i]! + n]!)} />
        ) : block.kind === 'link' ? (
          <Pressable key={i} accessibilityRole="link" onPress={() => router.push(block.route as never)}>
            <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20 }}>
              <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' }}>
                {block.label}
              </Text>
              {block.tail}
            </Text>
          </Pressable>
        ) : block.kind === 'ordered' ? (
          <View key={i} style={{ gap: spacing[1] }}>
            {block.items.map((line, n) => (
              <Rich key={line} v="b1" text={`${n + 1}. ${line}`} markId={item.id} hitsBefore={above[first[i]! + n]} {...big} />
            ))}
          </View>
        ) : (
          // The bubble's own gap is 6; the board's `.cthread ul{margin:4px 0 0}` adds 4 on top of `.mc{gap:6}` = 10 (ChatBotHeader y245 -> y255).
          <View key={i} style={{ gap: spacing[1], marginTop: spacing[1] }}>
            {block.items.map((line, n) => (
              <Rich key={line} v="b1" text={line} markId={item.id} hitsBefore={above[first[i]! + n]} {...big} />
            ))}
          </View>
        ),
      )}
      {item.detail ? <Detail text={item.detail} /> : null}
      {item.card ? <PlanBlock item={item.card} /> : null}
      {item.diff ? <DiffDetail item={item.diff} /> : null}
      {/* A closing line's summary is grey 15 text with "•" in it, not the dotted list (ChatDone, ChatKeyboardIOS). */}
      {item.bullets?.length ? <Rich v="b2" color="t2" text={item.bullets.map((line) => `• ${line}`).join('\n')} markId={item.id} /> : null}
      {item.result && onView ? <ResultLine card={item.result} onView={onView} /> : null}
      {item.sources?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 6 }}>
          <Text v="c1" color="t2" allowFontScaling={!xl} style={{ fontSize: 14, lineHeight: 20 }}>
            출처:
          </Text>
          {item.sources.map((source) => (
            <Pressable key={`${source.kind}-${source.id}`} accessibilityRole="link" onPress={() => router.push(materialDetailPath(source.kind, source.id))}>
              <FindText itemId={`${item.id}:source`} v="c1" allowFontScaling={!xl} style={{ fontSize: 14, lineHeight: 20, textDecorationLine: 'underline', textDecorationColor: c.deco }}>
                {/* Searchable like the text (ChatBotHeaderFind draws "…pdf" marked); a source mark is never the current hit, as the board draws it. */}
                <Marked text={displayName(source.title)} itemId={`${item.id}:source`} />
              </FindText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Bubble>
  )
}

export default BotText
