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
  gap?: number
  moreGap?: number
}

const RecentList = <T,>({ items, keyOf, renderItem, onSeeAll, limit, gap = 0, moreGap = 0 }: Props<T>) => {
  const shown = onSeeAll ? recent(items, limit) : items
  return (
    <View style={{ gap: moreGap }}>
      <View style={{ gap }}>
        {shown.map((item) => (
          <View key={keyOf(item)}>{renderItem(item)}</View>
        ))}
      </View>
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
