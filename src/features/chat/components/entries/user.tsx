import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useXlBoardText, XL_CHAT_TRACKING } from '@/shared/components/xl-chrome'
import { spacing } from '../../../../theme'
import type { ChatItem } from '../../types'
import UserBubbleView from '../bubbles'
import { FindText, Marked } from '../header/highlight'
import { Appear } from '../motion'

export const useBubbleMax = (chrome: number) => (useWindowDimensions().width - spacing[5] * 2) * 0.82 + chrome

const UserBubble = ({ item }: { item: Extract<ChatItem, { type: 'user' }> }) => {
  const maxWidth = useBubbleMax(30)
  const xl = useXlBoardText()
  const [wrapped, setWrapped] = useState(false)
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-end', maxWidth }}>
      <UserBubbleView attachment={item.attachment} minWidth={wrapped ? maxWidth : undefined}>
        <FindText itemId={item.id} v="b1" style={xl ? { fontSize: 21, lineHeight: 30, letterSpacing: XL_CHAT_TRACKING } : { lineHeight: 23 }} allowFontScaling={!xl} onTextLayout={(e) => setWrapped(e.nativeEvent.lines.length > 1)}>
          <Marked text={item.text} itemId={item.id} />
        </FindText>
      </UserBubbleView>
    </Appear>
  )
}

export default UserBubble
