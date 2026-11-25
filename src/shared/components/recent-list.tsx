import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
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
    <View style={styles.gap(moreGap)}>
      <View style={styles.gap(gap)}>
        {shown.map((item) => (
          <View key={keyOf(item)}>{renderItem(item)}</View>
        ))}
      </View>
      {onSeeAll && items.length > shown.length ? (
        <Pressable accessibilityRole="button" onPress={onSeeAll} style={styles.more}>
          <Text v="b2" color="t3" style={styles.moreLabel}>
            전체 보기
          </Text>
          <Icon name="chev" size={18} color="t3" />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  gap: (gap: number) => ({ gap }),
  more: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1], minHeight: 48 },
  moreLabel: { flex: 1 },
}))

export default RecentList
