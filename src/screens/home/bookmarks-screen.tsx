import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityBookmarks } from '@/features/my'
import { ScreenBar } from '@/shared/components'
import { useColors } from '@/theme'

/** 홈 > 북마크: a page of its own on top of the home tab, not the 마이 tab. */
const BookmarksScreen = () => {
  const c = useColors()
  const { top } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBar bar={{ title: '북마크', onBack: () => router.back() }}>
        {({ topInset, onScroll }) => (
          <ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={onScroll} scrollEventThrottle={16} // `automatic` already adds the status-bar inset, which the bar's height counts too: take it off once.
            contentContainerStyle={{ paddingTop: Math.max(topInset - top, 0) }}>
            <ActivityBookmarks />
          </ScrollView>
        )}
      </ScreenBar>
    </View>
  )
}

export default BookmarksScreen
