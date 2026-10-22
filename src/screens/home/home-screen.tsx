import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { Section, Shortcut, SHORTCUTS, useHomeSections } from '@/features/home'
import { SECTIONS, useToggleBookmark, type SectionKind } from '@/features/jobs'
import { useUnreadCount } from '@/features/notifications'
import { GlassButton, TopBar, Wordmark } from '@/shared/components'
import { useColors } from '@/theme'

const HomeScreen = () => {
  const c = useColors()
  const unread = useUnreadCount()
  const toggleBookmark = useToggleBookmark()
  const kinds: SectionKind[] = useHomeSections()
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
        {kinds.map((kind) => (
          <Section key={kind} kind={kind} title={SECTIONS[kind].title} onBookmark={toggleBookmark} />
        ))}
      </ScrollView>
    </View>
  )
}

export default HomeScreen
