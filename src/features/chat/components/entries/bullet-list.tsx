import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { BUBBLE_PAD_X, useBotBubbleMax } from './bubble'
import Rich from './rich'

const BULLET_DOT = 6
const BULLET_INDENT = 1
const BULLET_GAP = 13
const BULLET_LEAD = BULLET_INDENT + BULLET_DOT + BULLET_GAP

const BulletList = ({ items, markId, hitsBefore }: { items: string[]; markId: string; hitsBefore?: number[] }) => {
  const textMax = useBotBubbleMax() - BUBBLE_PAD_X * 2 - BULLET_LEAD
  return (
    <View style={styles.bullets}>
      {items.map((line, i) => (
        <View key={line} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Rich v="b1" text={line} markId={markId} hitsBefore={hitsBefore?.[i]} style={styles.item(textMax)} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  bullets: { gap: 2 },
  bulletRow: { flexDirection: 'row', gap: BULLET_GAP, paddingLeft: BULLET_INDENT },
  bulletDot: { width: BULLET_DOT, height: BULLET_DOT, borderRadius: BULLET_DOT / 2, marginTop: 10, backgroundColor: theme.colors.t1 },
  item: (maxWidth: number) => ({ flexShrink: 1, maxWidth }),
}))

export default BulletList
