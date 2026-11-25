import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityBookmarks } from '@/features/my'
import { ScreenBar } from '@/shared/components'
import { useColors } from '@/theme'

const BookmarksScreen = () => {
  const c = useColors()
  const { top } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBar bar={{ title: '북마크', onBack: () => router.back() }}>
        {({ topInset, onScroll }) => (
          <ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={onScroll} scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: Math.max(topInset - top, 0) }}>
            <ActivityBookmarks />
          </ScrollView>
        )}
      </ScreenBar>
    </View>
  )
}

export default BookmarksScreen
