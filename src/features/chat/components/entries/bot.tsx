import { router } from 'expo-router'
import { useContext } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { materialDetailPath } from '@/features/bots'
import { Text } from '@/shared/components'
import { useXlBoardText, XL_CHAT_TRACKING } from '@/shared/components/xl-chrome'
import { displayName } from '@/shared/utility/display-name'
import type { ChatItem } from '../../types'
import { splitBotText, type BotTextBlock } from '../../utils/bot-text'
import { hitsBefore } from '../../utils/find'
import { FindHighlight } from '../header/find-highlight'
import FindText from '../header/find-text'
import Marked from '../header/marked'
import Bubble, { BUBBLE_PAD_X, useBotBubbleMax } from './bubble'
import BulletList from './bullet-list'
import Detail from './detail'
import MdTable from './md-table'
import NumberedList from './numbered-list'
import ProfileUndo from './profile-undo'
import Rich, { plainOf } from './rich'

const XL_LINE = { fontSize: 21, lineHeight: 31, letterSpacing: XL_CHAT_TRACKING }

const useTableWidth = () => useBotBubbleMax() - BUBBLE_PAD_X * 2

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
              <Rich key={n} v="b1" text={line} markId={item.id} hitsBefore={above[first[i]! + n]} {...big} />
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
  subHeading: { marginTop: theme.spacing[1] },
  small: { fontSize: 14, lineHeight: 20 },
  underline: { textDecorationLine: 'underline' },
  deco: { textDecorationColor: theme.colors.deco },
  list: { gap: theme.spacing[1], marginTop: theme.spacing[1] },
  sources: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 6 },
}))

export default BotText
