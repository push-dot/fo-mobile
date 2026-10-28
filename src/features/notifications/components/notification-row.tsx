import { Pressable, View } from 'react-native'
import type { AppNotification, NotificationType } from '@push/api-client'
import { Icon, Text, type IconName } from '../../../shared/components'
import { useColors, type Colors } from '../../../theme'
import { timeLabel } from '../utils'

const KIND: Record<NotificationType, { icon: IconName; fg: keyof Colors; bg: keyof Colors }> = {
  AI_DONE: { icon: 'spark', fg: 'acText', bg: 'acSoft' },
  OFFER: { icon: 'inbox', fg: 'green', bg: 'greenSoft' },
  DEADLINE: { icon: 'clock', fg: 'red', bg: 'redSoft' },
  COMMENT: { icon: 'chat', fg: 'orange', bg: 'orangeSoft' },
  APPLICATION_STAGE: { icon: 'brief', fg: 'acText', bg: 'acSoft' },
}

const NotificationRow = ({ n, onPress }: { n: AppNotification; onPress: () => void }) => {
  const c = useColors()
  const k = KIND[n.type]
  const unread = !n.readAt
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? '안 읽음, ' : ''}${n.title}, ${n.body}, ${timeLabel(n.createdAt)}`}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: pressed ? c.fill : undefined })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c[k.bg] }}>
        <Icon name={k.icon} size={22} color={k.fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Text v="c1" weight="600" color="t3" style={{ flex: 1 }}>
            {n.title}
          </Text>
          <Text v="c2" color="t3">
            {timeLabel(n.createdAt)}
          </Text>
        </View>
        <Text v="b2" weight={unread ? '600' : '400'} color={unread ? 't1' : 't2'}>
          {n.body}
        </Text>
      </View>
      <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 8, backgroundColor: unread ? c.ac : 'transparent' }} />
    </Pressable>
  )
}

export default NotificationRow
