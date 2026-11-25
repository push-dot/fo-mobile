import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { View } from 'react-native'
import type { AppNotification } from '@push/api-client'
import {
  groupLabel,
  NOTIFICATION_EMPTY,
  NOTIFICATION_SETTINGS_LABEL,
  NOTIFICATION_SKELETON,
  notificationHref,
  NotificationRow,
  openNotificationSettings,
  useNotificationSettingsVisible,
  useNotifications,
  useReadNotifications,
} from '@/features/notifications'
import { Button, ScreenBar, Skeleton, SkeletonRows, StatusNote, Text } from '@/shared/components'
import { useXlChrome } from '@/shared/components/xl-chrome'
import { spacing, useColors } from '@/theme'

type Row = { type: 'header'; key: string; title: string; first: boolean } | { type: 'item'; key: string; n: AppNotification }

const NotificationsScreen = () => {
  const c = useColors()
  const q = useNotifications()
  const read = useReadNotifications()
  const { button } = useXlChrome()
  const settingsVisible = useNotificationSettingsVisible()
  const items = q.data?.data ?? []
  const rows = ['오늘', '이번 주', '이전'].flatMap((title): Row[] => {
    const data = items.filter((n) => groupLabel(n.createdAt) === title)
    return data.length ? [{ type: 'header', key: `h:${title}`, title, first: false }, ...data.map((n): Row => ({ type: 'item', key: n.id, n }))] : []
  }).map((r, i) => (r.type === 'header' ? { ...r, first: i === 0 } : r))
  const unread = items.some((n) => !n.readAt)

  const open = (n: AppNotification) => {
    if (!n.readAt) read.mutate([n.id])
    const href = notificationHref(n)
    if (href) router.push(href)
  }
  const renderItem = ({ item }: { item: Row }) =>
    item.type === 'header' ? (
      <Text v="c1" weight="700" color="t3" style={{ paddingHorizontal: spacing[6], paddingTop: item.first ? spacing[2] : 22, paddingBottom: spacing[2] }}>
        {item.title}
      </Text>
    ) : (
      <NotificationRow n={item.n} onPress={open} />
    )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBar
        bar={{
          title: '알림',
          onBack: () => router.back(),
          pillRight: true,
          right: <Button label="모두 읽음" variant="secondary" size="sm" glass paddingX={18} style={{ minHeight: button }} disabled={!q.isPending && !unread} onPress={() => read.mutate('all')} />,
        }}
      >
        {({ topInset, onScroll }) => (
        <LegendList
          data={rows}
          keyExtractor={(r) => r.key}
          getItemType={(r) => r.type}
          estimatedItemSize={72}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ flexGrow: 1, paddingTop: topInset }}
            onScroll={onScroll}
            scrollEventThrottle={64}
          renderItem={renderItem}
          ListEmptyComponent={
            q.isPending ? (
              <View>
                <View style={{ paddingHorizontal: spacing[6], paddingVertical: spacing[2] }}>
                  <Skeleton width={40} height={12} />
                </View>
                <SkeletonRows {...NOTIFICATION_SKELETON} />
              </View>
            ) : q.isError ? (
              <Text v="b2" color="t3" style={{ textAlign: 'center', marginTop: 40 }}>
                알림을 불러오지 못했어요. 잠시 후 다시 열어 주세요.
              </Text>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: 60, paddingHorizontal: 32 }}>
                <StatusNote
                  lines={[NOTIFICATION_EMPTY]}
                  action={settingsVisible ? { label: NOTIFICATION_SETTINGS_LABEL, onPress: openNotificationSettings } : undefined}
                />
              </View>
            )
          }
        />
        )}
      </ScreenBar>
    </View>
  )
}

export default NotificationsScreen
