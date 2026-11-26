import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { BUBBLE_PAD_X, useBotBubbleMax } from './bubble'
import Rich from './rich'

const NUMBER_COL = 24

const NumberMark = ({ n, color = 't1' }: { n: number; color?: 't1' | 't3' }) => (
  <View style={styles.number}>
    <Text v="b1" color={color}>{`${n}.`}</Text>
  </View>
)

const NumberedList = ({ items, markId, hitsBefore }: { items: string[]; markId?: string; hitsBefore?: number[] }) => {
  const textMax = useBotBubbleMax() - BUBBLE_PAD_X * 2 - NUMBER_COL
  return (
    <View style={styles.numbered}>
      {items.map((line, n) => (
        <View key={n} style={styles.row}>
          <NumberMark n={n + 1} />
          <Rich v="b1" text={line} markId={markId} hitsBefore={hitsBefore?.[n]} style={styles.item(textMax)} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  item: (maxWidth: number) => ({ flexShrink: 1, maxWidth }),
  number: { width: NUMBER_COL },
  numbered: { gap: 2, marginTop: 2 },
  row: { flexDirection: 'row' },
})

export default NumberedList
