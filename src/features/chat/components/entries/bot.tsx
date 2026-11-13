import { View } from 'react-native'
import { Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import type { ChatItem } from '../../types'
import { Appear } from '../motion'
import Glyph, { Dot } from './glyph'
import Rich from './rich'

const AUTO_PICK = /^자동으로 골랐어요/

const BotText = ({ item }: { item: Extract<ChatItem, { type: 'agentText' }> }) => {
  const c = useColors()
  if (AUTO_PICK.test(item.text))
    return (
      <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Glyph still size={14} color={c.acText} />
        <Text v="c1" color="t3">
          {item.text}
        </Text>
      </Appear>
    )
  return (
    <Appear style={{ flexDirection: 'row', gap: 10 }}>
      <Dot color={c.ac} />
      <View style={{ flex: 1, gap: 6 }}>
        <Rich v="b1" text={item.text} />
        {item.bullets?.length ? (
          <Text v="b2" color="t2">
            {item.bullets.map((bullet) => `• ${bullet}`).join('\n')}
          </Text>
        ) : null}
      </View>
    </Appear>
  )
}

export default BotText
