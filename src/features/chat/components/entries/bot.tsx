import { router } from 'expo-router'
import { useContext } from 'react'
import { Pressable, View, useWindowDimensions } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { materialDetailPath } from '@/features/bots'
import { Text } from '@/shared/components'
import { useXlBoardText, XL_CHAT_TRACKING } from '@/shared/components/xl-chrome'
import { displayName } from '@/shared/utility/display-name'
import { spacing } from '../../../../theme'
import type { ChatItem } from '../../types'
import { splitBotText, type BotTextBlock } from '../../utils/bot-text'
import { hitsBefore } from '../../utils/find'
import { Appear } from '../motion'
import { FindHighlight, FindText, Marked } from '../header/highlight'
import Detail from './detail'
import MdTable from './md-table'
import ProfileUndo from './profile-undo'
import Rich, { plainOf } from './rich'

const XL_LINE = { fontSize: 21, lineHeight: 31, letterSpacing: XL_CHAT_TRACKING }

export const useBotBubbleMax = () => (useWindowDimensions().width - spacing[5] * 2) * 0.88
const BUBBLE_PAD_X = 15
const BULLET_DOT = 6
const BULLET_INDENT = 1
const BULLET_GAP = 13
const BULLET_LEAD = BULLET_INDENT + BULLET_DOT + BULLET_GAP
const useTableWidth = () => useBotBubbleMax() - BUBBLE_PAD_X * 2

export const Bubble = ({ children, gap = 6, wide }: { children: React.ReactNode; gap?: number; wide?: boolean }) => {
  const maxWidth = useBotBubbleMax()
  return (
    <Appear kind="bubble" style={styles.appear(maxWidth, !!wide)}>
      <View style={styles.bubble(maxWidth, gap)}>
        {children}
      </View>
    </Appear>
  )
}

export const BulletList = ({ items, markId, hitsBefore }: { items: string[]; markId: string; hitsBefore?: number[] }) => {
  const textMax = useBotBubbleMax() - BUBBLE_PAD_X * 2 - BULLET_LEAD
  return (
    <View style={styles.bullets}>
      {items.map((line, i) => (
        <View key={line} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Rich v="b1" text={line} markId={markId} hitsBefore={hitsBefore?.[i]} style={styles.item(textMax)} />
        </View>
      ))}
    </View>
  )
}

const NUMBER_COL = 24

const NumberMark = ({ n, color = 't1' }: { n: number; color?: 't1' | 't3' }) => (
  <View style={styles.number}>
    <Text v="b1" color={color}>{`${n}.`}</Text>
  </View>
)

export const NumberedList = ({ items, markId, hitsBefore }: { items: string[]; markId?: string; hitsBefore?: number[] }) => {
  const textMax = useBotBubbleMax() - BUBBLE_PAD_X * 2 - NUMBER_COL
  return (
    <View style={styles.numbered}>
      {items.map((line, n) => (
        <View key={line} style={styles.row}>
          <NumberMark n={n + 1} />
          <Rich v="b1" text={line} markId={markId} hitsBefore={hitsBefore?.[n]} style={styles.item(textMax)} />
        </View>
      ))}
    </View>
  )
}

const markedLines = (block: BotTextBlock): string[] =>
  block.kind === 'paragraph' || block.kind === 'heading' ? [block.text] : block.kind === 'ordered' || block.kind === 'bullets' || block.kind === 'list' ? block.items : []

const BotText = ({ item }: { item: Extract<ChatItem, { type: 'agentText' }> }) => {
  const tableWidth = useTableWidth()
  const xl = useXlBoardText()
  const big = xl ? { style: XL_LINE, allowFontScaling: false } : null
  const { query } = useContext(FindHighlight)
  const blocks = splitBotText(item.text)
  const lines = blocks.flatMap(markedLines)
  const above = hitsBefore(lines.map(plainOf), query)
  const first = blocks.map((_, i) => blocks.slice(0, i).reduce((sum, b) => sum + markedLines(b).length, 0))
  return (
    <Bubble>
      {blocks.map((block, i) =>
        block.kind === 'paragraph' ? (
          <Rich key={i} v="b1" text={block.text} markId={item.id} hitsBefore={above[first[i]!]} {...big} />
        ) : block.kind === 'heading' ? (
          <Rich key={i} v={block.level === 1 ? 'h3' : 'b2'} weight={block.level === 1 ? '700' : '600'} style={block.level === 1 ? undefined : styles.subHeading} text={block.text} markId={item.id} hitsBefore={above[first[i]!]} />
        ) : block.kind === 'sub' ? (
          <Pressable key={i} accessibilityRole={block.route ? 'link' : 'text'} disabled={!block.route} onPress={() => router.push(block.route as never)}>
            <Text v="c1" color="t3" style={styles.small}>
              {block.text}
            </Text>
          </Pressable>
        ) : block.kind === 'table' ? (
          <MdTable key={i} table={block} width={tableWidth} />
        ) : block.kind === 'bullets' ? (
          <BulletList key={i} items={block.items} markId={item.id} hitsBefore={block.items.map((_, n) => above[first[i]! + n]!)} />
        ) : block.kind === 'link' ? (
          <Pressable key={i} accessibilityRole="link" onPress={() => router.push(block.route as never)}>
            <Text v="c1" color="t3" style={styles.small}>
              <Text v="c1" color="t3" style={[styles.small, styles.underline]}>
                {block.label}
              </Text>
              {block.tail}
            </Text>
          </Pressable>
        ) : block.kind === 'ordered' ? (
          <NumberedList key={i} items={block.items} markId={item.id} hitsBefore={block.items.map((_, n) => above[first[i]! + n]!)} />
        ) : (
          <View key={i} style={styles.list}>
            {block.items.map((line, n) => (
              <Rich key={line} v="b1" text={line} markId={item.id} hitsBefore={above[first[i]! + n]} {...big} />
            ))}
          </View>
        ),
      )}
      {item.undo ? <ProfileUndo changeId={item.undo} /> : null}
      {item.detail ? <Detail text={item.detail} /> : null}
      {item.bullets?.length ? <BulletList items={item.bullets} markId={item.id} /> : null}
      {item.sources?.length ? (
        <View style={styles.sources}>
          <Text v="c1" color="t2" allowFontScaling={!xl} style={styles.small}>
            출처:
          </Text>
          {item.sources.map((source) => (
            <Pressable key={`${source.kind}-${source.id}`} accessibilityRole="link" onPress={() => router.push(materialDetailPath(source.kind, source.id))}>
              <FindText itemId={`${item.id}:source`} v="c1" allowFontScaling={!xl} style={[styles.small, styles.underline, styles.deco]}>
                <Marked text={displayName(source.title)} itemId={`${item.id}:source`} />
              </FindText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Bubble>
  )
}

const styles = StyleSheet.create((theme) => ({
  appear: (maxWidth: number, wide: boolean) => ({ alignSelf: 'flex-start', maxWidth, ...(wide ? { width: maxWidth } : null) }),
  bubble: (maxWidth: number, gap: number) => ({ maxWidth, gap, paddingVertical: 11, paddingHorizontal: BUBBLE_PAD_X, borderRadius: theme.radius.lg, borderBottomLeftRadius: theme.radius.xs, backgroundColor: theme.colors.fill }),
  bullets: { gap: 2 },
  bulletRow: { flexDirection: 'row', gap: BULLET_GAP, paddingLeft: BULLET_INDENT },
  bulletDot: { width: BULLET_DOT, height: BULLET_DOT, borderRadius: BULLET_DOT / 2, marginTop: 10, backgroundColor: theme.colors.t1 },
  item: (maxWidth: number) => ({ flexShrink: 1, maxWidth }),
  number: { width: NUMBER_COL },
  numbered: { gap: 2, marginTop: 2 },
  row: { flexDirection: 'row' },
  subHeading: { marginTop: theme.spacing[1] },
  small: { fontSize: 14, lineHeight: 20 },
  underline: { textDecorationLine: 'underline' },
  deco: { textDecorationColor: theme.colors.deco },
  list: { gap: theme.spacing[1], marginTop: theme.spacing[1] },
  sources: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 6 },
}))

export default BotText
