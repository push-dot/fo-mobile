import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { spacing } from '../../theme'
import { recent } from '../utility/recent'
import Icon from './icon'
import Text from './text'

type Props<T> = {
  items: readonly T[]
  keyOf: (item: T) => string
  renderItem: (item: T) => ReactNode
  onSeeAll?: () => void
  limit?: number
}

const RecentList = <T,>({ items, keyOf, renderItem, onSeeAll, limit }: Props<T>) => {
  const shown = recent(items, limit)
  return (
    <View>
      {shown.map((item) => (
        <View key={keyOf(item)}>{renderItem(item)}</View>
      ))}
      {onSeeAll && items.length > shown.length ? (
        <Pressable accessibilityRole="button" onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1], minHeight: 48 }}>
          <Text v="b2" color="t3" style={{ flex: 1 }}>
            전체 보기
          </Text>
          <Icon name="chev" size={18} color="t3" />
        </Pressable>
      ) : null}
    </View>
  )
}

export default RecentList
