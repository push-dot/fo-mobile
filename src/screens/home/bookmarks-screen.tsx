import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { ActivityBookmarks } from '@/features/my'
import { ScreenBar } from '@/shared/components'

const BookmarksScreen = () => {
  return (
    <View style={styles.screen}>
      <ScreenBar bar={{ title: '북마크', onBack: () => router.back() }}>
        {() => (
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            <ActivityBookmarks />
          </ScrollView>
        )}
      </ScreenBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
}))

export default BookmarksScreen
