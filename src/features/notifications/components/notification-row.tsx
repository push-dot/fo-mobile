import { memo } from 'react'
import { Pressable, View } from 'react-native'
import type { AppNotification } from '@push/api-client'
import { Text } from '../../../shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { notificationTitle, timeLabel } from '../utils'

const NotificationRow = ({ n, onPress }: { n: AppNotification; onPress: (item: AppNotification) => void }) => {
  const c = useColors()
  const unread = !n.readAt
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? '안 읽음, ' : ''}${notificationTitle(n)}, ${n.body}, ${timeLabel(n.createdAt)}`}
      onPress={() => onPress(n)}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: spacing[5], paddingVertical: 14, backgroundColor: pressed ? c.fill : undefined })}
    >
      <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Text v="c1" weight="600" color="t3" style={{ flex: 1 }}>
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
      <View style={{ width: 8, height: 8, borderRadius: radius.xs, marginTop: spacing[2], backgroundColor: unread ? c.ac : 'transparent' }} />
    </Pressable>
  )
}

export default memo(NotificationRow)
