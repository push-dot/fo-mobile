import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { materialDetailPath } from '@/features/bots'
import { Icon, Text } from '@/shared/components'
import { useXlBoardText } from '@/shared/components/xl-chrome'
import { onAccent, radius, spacing, useColors } from '../../../../theme'
import type { ChatItem } from '../../types'
import { splitBotText } from '../../utils/bot-text'
import { Appear } from '../motion'
import { Marked } from '../header/highlight'
import Glyph from './glyph'
import { BubbleCard } from './plan-card'
import Rich from './rich'

const AUTO_PICK = /^자동으로 골랐어요/
// ChatStates.4: the line that tells an application was recorded is a green check line, not a bubble.
const RECORDED = /^지원했어요 · /
// ChatBotHeaderXL draws a bot line at 21 over 31 (.msg under .xl): the system scale of 16 came out 5 % smaller, so XL sets the size itself.
const XL_LINE = { fontSize: 21, lineHeight: 31 }

const BotText = ({ item }: { item: Extract<ChatItem, { type: 'agentText' }> }) => {
  const c = useColors()
  const xl = useXlBoardText()
  const big = xl ? { style: XL_LINE, allowFontScaling: false } : null
  if (AUTO_PICK.test(item.text))
    return (
      <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Glyph still color={c.t3} />
        <Text v="c1" color="t3">
          {item.text}
        </Text>
      </Appear>
    )
  if (RECORDED.test(item.text))
    return (
      <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={12} color={onAccent} />
        </View>
        <Text v="c1" weight="600" style={{ color: c.green, flexShrink: 1 }}>
          {item.text}
        </Text>
      </Appear>
    )
  return (
    // With a card inside, the board's box fills its max width (the card's rows wrap), and the gap to the card is 10.
    <Appear kind="bubble" style={{ alignSelf: 'flex-start', maxWidth: '88%', ...(item.card ? { width: '88%' } : null) }}>
      <View style={{ gap: item.card ? 10 : 6, paddingVertical: 11, paddingHorizontal: 15, borderRadius: radius.lg, borderBottomLeftRadius: radius.xs, backgroundColor: c.fill }}>
        {splitBotText(item.text).map((block, i) =>
          block.kind === 'paragraph' ? (
            <Rich key={i} v="b1" text={block.text} markId={item.id} {...big} />
          ) : (
            // The bubble's own gap is 6; the board's `.cthread ul{margin:4px 0 0}` adds 4 on top of `.mc{gap:6}` = 10 (ChatBotHeader y245 -> y255).
            <View key={i} style={{ gap: spacing[1], marginTop: spacing[1] }}>
              {block.items.map((line) => (
                <Rich key={line} v="b1" text={line} markId={item.id} {...big} />
              ))}
            </View>
          ),
        )}
        {item.card ? <BubbleCard item={item.card} /> : null}
        {item.bullets?.length ? (
          <Text v="b2" color="t2">
            {item.bullets.map((bullet) => `• ${bullet}`).join('\n')}
          </Text>
        ) : null}
        {item.sources?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 6 }}>
            <Text v="c1" color="t2" style={{ fontSize: 14, lineHeight: 20 }}>
              출처:
            </Text>
            {item.sources.map((source) => (
              <Pressable key={`${source.kind}-${source.id}`} accessibilityRole="link" onPress={() => router.push(materialDetailPath(source.kind, source.id))}>
                <Text v="c1" style={{ fontSize: 14, lineHeight: 20, textDecorationLine: 'underline', textDecorationColor: c.deco }}>
                  {/* Searchable like the text (ChatBotHeaderFind draws "…pdf" marked); a source mark is never the current hit, as the board draws it. */}
                  <Marked text={source.title} itemId={`${item.id}:source`} />
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Appear>
  )
}

export default BotText
