import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { HOME_SKELETON_SECTIONS, Section, Shortcut, SHORTCUTS, useHomeSections } from '@/features/home'
import { useToggleBookmark } from '@/features/jobs/api/hooks'
import { SECTIONS } from '@/features/jobs/constants'
import type { SectionKind } from '@/features/jobs/types'
import { useUnreadCount } from '@/features/notifications'
import { GlassButton, TopBar, Wordmark } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const HomeScreen = () => {
  const c = useColors()
  const unread = useUnreadCount()
  const toggleBookmark = useToggleBookmark()
  const kinds: SectionKind[] = useHomeSections()
  const [scrolled, setScrolled] = useState(false)
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        left={<Wordmark size={scrolled ? 20 : 24} />}
        right={
          <>
            <GlassButton actions={[{ icon: 'search', label: '검색', onPress: () => router.push('/search') }]} />
            <GlassButton
              actions={[{ icon: 'bell', label: unread ? `알림 ${unread}개` : '알림', badge: unread, onPress: () => router.push('/notifications') }]}
            />
          </>
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={64}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 0)}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={{ flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[2] }}>
          {SHORTCUTS.map((s) => (
            <Shortcut key={s.label} {...s} />
          ))}
        </View>
        {kinds.map((kind, index) => (
          <Section key={kind} kind={kind} title={SECTIONS[kind].title} skeleton={index < HOME_SKELETON_SECTIONS} onBookmark={toggleBookmark} />
        ))}
      </ScrollView>
    </View>
  )
}

export default HomeScreen
