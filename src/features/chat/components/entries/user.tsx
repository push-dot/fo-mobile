import { View, useWindowDimensions } from 'react-native'
import { Icon, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../../theme'
import type { ChatItem } from '../../types'
import { Appear } from '../motion'

export const useBubbleMax = (chrome: number) => (useWindowDimensions().width - spacing[5] * 2) * 0.82 + chrome

const UserBubble = ({ item }: { item: Extract<ChatItem, { type: 'user' }> }) => {
  const c = useColors()
  const maxWidth = useBubbleMax(30)
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-end', maxWidth }}>
      <View style={{ paddingVertical: 11, paddingHorizontal: 15, borderRadius: radius.lg, borderBottomRightRadius: radius.xs, backgroundColor: c.fill }}>
        <Text v="b1" style={{ lineHeight: 23 }}>
          {item.text}
        </Text>
        {item.attachment ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[2], paddingVertical: spacing[2], paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: c.bg }}>
            <Icon name="paper" size={16} color="t2" />
            <Text v="c1" weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
              {item.attachment}
            </Text>
          </View>
        ) : null}
      </View>
    </Appear>
  )
}

export default UserBubble
