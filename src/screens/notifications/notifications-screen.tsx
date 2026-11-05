import { router } from 'expo-router'
import { SectionList, View } from 'react-native'
import type { AppNotification } from '@push/api-client'
import {
  EmptyBell,
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
import { Button, Skeleton, SkeletonRows, StatusNote, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const NotificationsScreen = () => {
  const c = useColors()
  const q = useNotifications()
  const read = useReadNotifications()
  const settingsVisible = useNotificationSettingsVisible()
  const items = q.data?.data ?? []
  const sections = ['오늘', '이번 주', '이전']
    .map((title) => ({ title, data: items.filter((n) => groupLabel(n.createdAt) === title) }))
    .filter((s) => s.data.length)
  const unread = items.some((n) => !n.readAt)

  const open = (n: AppNotification) => {
    if (!n.readAt) read.mutate([n.id])
    const href = notificationHref(n)
    if (href) router.push(href)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="알림"
        onBack={() => router.back()}
        right={<Button label="모두 읽음" variant="secondary" size="sm" disabled={!q.isPending && !unread} onPress={() => read.mutate('all')} />}
      />
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        contentInsetAdjustmentBehavior="automatic"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text v="c1" weight="700" color="t3" style={{ paddingHorizontal: 24, paddingTop: section.title === sections[0]?.title ? 6 : 22, paddingBottom: 8 }}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => <NotificationRow n={item} onPress={() => open(item)} />}
        ListEmptyComponent={
          q.isPending ? (
            <View>
              <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
                <Skeleton width={40} height={12} />
              </View>
              <SkeletonRows {...NOTIFICATION_SKELETON} />
            </View>
          ) : q.isError ? (
            <Text v="b2" color="t3" style={{ textAlign: 'center', marginTop: 40 }}>
              알림을 불러오지 못했어요. 잠시 후 다시 열어 주세요.
            </Text>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <EmptyBell />
              <StatusNote
                lines={[NOTIFICATION_EMPTY]}
                action={settingsVisible ? { label: NOTIFICATION_SETTINGS_LABEL, onPress: openNotificationSettings } : undefined}
              />
            </View>
          )
        }
      />
    </View>
  )
}

export default NotificationsScreen
