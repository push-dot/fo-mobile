import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { AppNotification } from '@push/api-client'
import { Text } from '../../../shared/components'
import { notificationTitle, timeLabel } from '../utils'

const NotificationRow = ({ n, onPress }: { n: AppNotification; onPress: (item: AppNotification) => void }) => {
  const unread = !n.readAt
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? '안 읽음, ' : ''}${notificationTitle(n)}, ${n.body}, ${timeLabel(n.createdAt)}`}
      onPress={() => onPress(n)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.body}>
        <View style={styles.head}>
          <Text v="c1" weight="600" color="t3" style={styles.title}>
            {notificationTitle(n)}
          </Text>
          <Text v="c2" color="t3">
            {timeLabel(n.createdAt)}
          </Text>
        </View>
        <Text v="b2" weight={unread ? '600' : '400'} color={unread ? 't1' : 't2'}>
          {n.body}
        </Text>
      </View>
      <View style={[styles.dot, unread && styles.dotUnread]} />
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: theme.spacing[5], paddingVertical: 14 },
  pressed: { backgroundColor: theme.colors.fill },
  body: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  head: { flexDirection: 'row', gap: theme.spacing[2] },
  title: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: theme.radius.xs, marginTop: theme.spacing[2], backgroundColor: 'transparent' },
  dotUnread: { backgroundColor: theme.colors.ac },
}))

export default NotificationRow
