import { View } from 'react-native'
import { Mascot, Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import type { BotRow } from '../../types'

const WIDTH = 300

const BotHomePreview = ({ row }: { row: BotRow }) => {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Mascot size={64} state={row.mascot} color={row.color} unread={row.unreadDot} motion={{ mode: 'animate' }} />
        <View style={styles.titles}>
          <Text v="h3" numberOfLines={2}>
            {row.name}
          </Text>
          {row.time ? (
            <Text v="c1" color="t3">
              {row.time}
            </Text>
          ) : null}
        </View>
      </View>
      <Text v="b2" color={row.line ? 't2' : 't3'} numberOfLines={5}>
        {row.line || '아직 나눈 대화가 없어요'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: { width: WIDTH, padding: theme.spacing[5], gap: theme.spacing[4], backgroundColor: theme.colors.bg, borderRadius: theme.radius.xl },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  titles: { flex: 1, minWidth: 0, gap: 2 },
}))

export default BotHomePreview
