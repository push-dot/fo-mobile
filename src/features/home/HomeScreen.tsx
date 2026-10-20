import { useQuery } from '@tanstack/react-query'
import { router, type Href } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { api } from '../../lib/api'
import { API_MOCK } from '../../lib/config'
import { useColors } from '../../theme'
import { GlassButton, Icon, Icon3D, JobCard, Text, TopBar, Wordmark, type Icon3DName } from '../../ui'
import { useToggleBookmark } from '../jobs/queries'
import { SECTIONS, type SectionKind } from '../jobs/SectionScreen'
import { useUnreadCount } from '../notifications/queries'

// Glow colours match each 3D icon's art, so they are not theme tokens.
const SHORTCUTS: { label: string; icon: Icon3DName; glow: string; opacity: number; href: Href }[] = [
  { label: '채용공고', icon: 'brief', glow: '#6C5CF5', opacity: 0.3, href: '/jobs' },
  { label: '북마크', icon: 'bookmark', glow: '#FF8A2A', opacity: 0.28, href: { pathname: '/(tabs)/(my)/my', params: { tab: 'activity', sub: 'bookmarks' } } },
  { label: '내 활동', icon: 'chart', glow: '#12A866', opacity: 0.26, href: { pathname: '/(tabs)/(my)/my', params: { tab: 'activity', sub: 'applications' } } },
]

// shortcut: push-be ignores ?sort (always newest), so 마감 임박 / 많이 본 would repeat 새로 올라온; shown in mock only
// until push-be sorts by deadline and views.
const HOME_SECTIONS: SectionKind[] = API_MOCK ? ['latest', 'deadline', 'popular'] : ['latest']

/** 홈: Push. header, three 3D shortcut cards, then 새로 올라온 · 마감 임박 · 많이 본 공고 rows. */
export function HomeScreen() {
  const c = useColors()
  const unread = useUnreadCount()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        left={<Wordmark size={24} />}
        right={
          <>
            <GlassButton actions={[{ icon: 'search', label: '검색', onPress: () => router.push('/search') }]} />
            <GlassButton
              actions={[{ icon: 'bell', label: unread ? `알림 ${unread}개` : '알림', badge: unread, onPress: () => router.push('/notifications') }]}
            />
          </>
        }
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 8 }}>
          {SHORTCUTS.map((s) => (
            <Shortcut key={s.label} {...s} />
          ))}
        </View>
        {HOME_SECTIONS.map((k) => (
          <Section key={k} kind={k} />
        ))}
      </ScrollView>
    </View>
  )
}

function Shortcut({ label, icon, glow, opacity, href }: (typeof SHORTCUTS)[number]) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => ({ flex: 1, height: 100, borderRadius: 22, overflow: 'hidden', backgroundColor: c.bg2, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      {/* radial-gradient(130% 90% at 85% 115%, glow 0%, transparent 62%) */}
      <Svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
        <Defs>
          <RadialGradient id={`glow-${icon}`} cx="85%" cy="115%" rx="130%" ry="90%" fx="85%" fy="115%">
            <Stop offset="0" stopColor={glow} stopOpacity={opacity} />
            <Stop offset="0.62" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#glow-${icon})`} />
      </Svg>
      <Text v="b1" weight="700" style={{ position: 'absolute', left: 14, top: 14, lineHeight: 22 }}>
        {label}
      </Text>
      <View
        style={{
          position: 'absolute',
          right: 6,
          bottom: 4,
          transform: [{ rotate: '-8deg' }],
          shadowColor: '#000000',
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Icon3D name={icon} size={52} />
      </View>
    </Pressable>
  )
}

function Section({ kind }: { kind: SectionKind }) {
  const q = useQuery({ queryKey: ['postings', 'home', kind], queryFn: () => api.postings.list({ sort: kind, limit: 10 }) })
  const toggleBookmark = useToggleBookmark()
  const items = q.data?.data ?? []
  // An empty 마감 임박 row would only be a heading; hide it.
  if (q.isSuccess && !items.length) return null
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 }}>
        <Text v="h2" accessibilityRole="header">
          {SECTIONS[kind].title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${SECTIONS[kind].title} 전체보기`}
          onPress={() => router.push(`/section/${kind}`)}
          hitSlop={12}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Text v="c1" weight="600" color="t3">
            전체보기
          </Text>
          <Icon name="chev" size={14} color="t3" />
        </Pressable>
      </View>
      {q.isPending ? (
        <ActivityIndicator style={{ height: 196 }} />
      ) : q.isError ? (
        <Text v="b2" color="t3" style={{ paddingHorizontal: 20 }}>
          공고를 불러오지 못했어요. 잠시 후 다시 열어 주세요.
        </Text>
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <JobCard posting={item} onPress={() => router.push(`/postings/${item.id}`)} onBookmark={() => toggleBookmark(item)} />
          )}
        />
      )}
    </View>
  )
}
