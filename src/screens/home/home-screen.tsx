import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { HOME_SECTION_KINDS, HOME_SKELETON_SECTIONS, Section, Shortcut, SHORTCUTS } from '@/features/home'
import { SECTIONS, useToggleBookmark } from '@/features/jobs'
import { useUnreadCount } from '@/features/notifications'
import { FloatingHeader, GlassButton, TopBar, Wordmark, useFloatingHeader } from '@/shared/components'

const HomeScreen = () => {
  const unread = useUnreadCount()
  const toggleBookmark = useToggleBookmark()
  const { scrolled, onHeight, onScroll, inset } = useFloatingHeader()
  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={64}
        onScroll={onScroll}
        contentContainerStyle={styles.content(inset)}
      >
        <View style={styles.shortcuts}>
          {SHORTCUTS.map((s) => (
            <Shortcut key={s.label} {...s} />
          ))}
        </View>
        {HOME_SECTION_KINDS.map((kind, index) => (
          <Section key={kind} kind={kind} title={SECTIONS[kind].title} skeleton={index < HOME_SKELETON_SECTIONS} onBookmark={toggleBookmark} />
        ))}
      </ScrollView>
      <FloatingHeader scrolled={scrolled} onHeight={onHeight}>
        <TopBar
          transparent
          left={<Wordmark />}
          right={
            <>
              <GlassButton actions={[{ icon: 'search', label: '검색', onPress: () => router.push('/search') }]} />
              <GlassButton
                actions={[{ icon: 'bell', label: unread ? `알림 ${unread}개` : '알림', badge: unread, onPress: () => router.push('/notifications') }]}
              />
            </>
          }
        />
      </FloatingHeader>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: (inset: number) => ({ paddingTop: inset, paddingBottom: 21 }),
  shortcuts: { flexDirection: 'row', gap: theme.spacing[2], paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[2] },
}))

export default HomeScreen
