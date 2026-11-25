import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityBookmarks } from '@/features/my'
import { ScreenBar } from '@/shared/components'

const BookmarksScreen = () => {
  const { top } = useSafeAreaInsets()
  return (
    <View style={styles.screen}>
      <ScreenBar bar={{ title: '북마크', onBack: () => router.back() }}>
        {({ topInset, onScroll }) => (
          <ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={onScroll} scrollEventThrottle={16}
            contentContainerStyle={styles.content(Math.max(topInset - top, 0))}>
            <ActivityBookmarks />
          </ScrollView>
        )}
      </ScreenBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: (paddingTop: number) => ({ paddingTop }),
}))

export default BookmarksScreen
