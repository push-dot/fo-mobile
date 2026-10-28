import { router } from 'expo-router'
import { ActivityIndicator, SectionList, View } from 'react-native'
import type { AppNotification } from '@push/api-client'
import { groupLabel, notificationHref, NotificationRow, useNotifications, useReadNotifications } from '@/features/notifications'
import { Button, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const NotificationsScreen = () => {
  const c = useColors()
  const q = useNotifications()
  const read = useReadNotifications()
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
        right={<Button label="모두 읽음" variant="secondary" size="sm" disabled={!unread} onPress={() => read.mutate('all')} />}
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
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <Text v="b2" color="t3" style={{ textAlign: 'center', marginTop: 40 }}>
              {q.isError ? '알림을 불러오지 못했어요. 잠시 후 다시 열어 주세요.' : '아직 받은 알림이 없어요.'}
            </Text>
          )
        }
      />
    </View>
  )
}

export default NotificationsScreen
