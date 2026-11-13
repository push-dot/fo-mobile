import { useWindowDimensions } from 'react-native'
import { Text } from '@/shared/components'
import { spacing } from '../../../../theme'
import type { ChatItem } from '../../types'
import UserBubbleView from '../bubbles'
import { Appear } from '../motion'

export const useBubbleMax = (chrome: number) => (useWindowDimensions().width - spacing[5] * 2) * 0.82 + chrome

const UserBubble = ({ item }: { item: Extract<ChatItem, { type: 'user' }> }) => {
  const maxWidth = useBubbleMax(30)
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-end', maxWidth }}>
      <UserBubbleView attachment={item.attachment}>
        <Text v="b1" style={{ lineHeight: 23 }}>
          {item.text}
        </Text>
      </UserBubbleView>
    </Appear>
  )
}

export default UserBubble
