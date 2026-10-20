import { router, type Href } from 'expo-router'
import { ActivityIndicator, Pressable, SectionList, View } from 'react-native'
import type { AppNotification, NotificationType } from '@push/api-client'
import { useColors, type Colors } from '../../theme'
import { Button, Icon, Text, TopBar, type IconName } from '../../ui'
import { groupLabel, timeLabel } from './format'
import { useNotifications, useReadNotifications } from './queries'

const KIND: Record<NotificationType, { icon: IconName; fg: keyof Colors; bg: keyof Colors }> = {
  AI_DONE: { icon: 'spark', fg: 'acText', bg: 'acSoft' },
  OFFER: { icon: 'inbox', fg: 'green', bg: 'greenSoft' },
  DEADLINE: { icon: 'clock', fg: 'red', bg: 'redSoft' },
  COMMENT: { icon: 'chat', fg: 'orange', bg: 'orangeSoft' },
}

// Where each notification opens (feature-spec 12.4).
const hrefOf = ({ target }: AppNotification): Href => {
  switch (target.kind) {
    case 'posting':
      return `/postings/${target.id}`
    case 'offer':
      return `/offers/${target.id}`
    case 'post':
      return `/posts/${target.id}`
    case 'conversation':
      return `/chat/${target.id}`
  }
}

/** 알림함: 4 types grouped by 오늘 · 이번 주 · 이전, unread dot, 모두 읽음. */
export function NotificationsScreen() {
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
    router.push(hrefOf(n))
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
        renderItem={({ item }) => <Row n={item} onPress={() => open(item)} />}
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

function Row({ n, onPress }: { n: AppNotification; onPress: () => void }) {
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
