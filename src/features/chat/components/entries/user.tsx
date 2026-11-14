import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { Text } from '@/shared/components'
import { useXlBoardText } from '@/shared/components/xl-chrome'
import { spacing } from '../../../../theme'
import type { ChatItem } from '../../types'
import UserBubbleView from '../bubbles'
import { Marked } from '../header/highlight'
import { Appear } from '../motion'

export const useBubbleMax = (chrome: number) => (useWindowDimensions().width - spacing[5] * 2) * 0.82 + chrome

// ChatBotHeaderXL draws the user line at 21 over 30 (.me under .xl); the system scale of 16 came out 5 % smaller.
const UserBubble = ({ item }: { item: Extract<ChatItem, { type: 'user' }> }) => {
  const maxWidth = useBubbleMax(30)
  const xl = useXlBoardText()
  const [wrapped, setWrapped] = useState(false)
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-end', maxWidth }}>
      <UserBubbleView attachment={item.attachment} minWidth={wrapped ? maxWidth : undefined}>
        <Text v="b1" style={xl ? { fontSize: 21, lineHeight: 30 } : { lineHeight: 23 }} allowFontScaling={!xl} onTextLayout={(e) => setWrapped(e.nativeEvent.lines.length > 1)}>
          <Marked text={item.text} itemId={item.id} />
        </Text>
      </UserBubbleView>
    </Appear>
  )
}

export default UserBubble
