import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { materialDetailPath } from '@/features/bots'
import { Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../../theme'
import type { ChatItem } from '../../types'
import { splitBotText } from '../../utils/bot-text'
import { Appear } from '../motion'
import Glyph from './glyph'
import Rich from './rich'

const AUTO_PICK = /^자동으로 골랐어요/

const BotText = ({ item }: { item: Extract<ChatItem, { type: 'agentText' }> }) => {
  const c = useColors()
  if (AUTO_PICK.test(item.text))
    return (
      <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        {/* ChatStates.1 and rule 3: the auto-select star is grey (board #545B66, the closest token is t2), not the accent. */}
        <Glyph still size={14} color={c.t2} />
        <Text v="c1" color="t3">
          {item.text}
        </Text>
      </Appear>
    )
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
      <View style={{ gap: 6, paddingVertical: 11, paddingHorizontal: 15, borderRadius: radius.lg, borderBottomLeftRadius: radius.xs, backgroundColor: c.fill }}>
        {splitBotText(item.text).map((block, i) =>
          block.kind === 'paragraph' ? (
            <Rich key={i} v="b1" text={block.text} markId={item.id} />
          ) : (
            // The bubble's own gap is 6; the board puts 4 between the paragraph and its list.
            <View key={i} style={{ gap: spacing[1], marginTop: -2 }}>
              {block.items.map((line) => (
                <Rich key={line} v="b1" text={line} markId={item.id} />
              ))}
            </View>
          ),
        )}
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
                  {source.title}
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
