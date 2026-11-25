import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityTab, type ActivitySub } from '@/features/my'
import { ScreenBar } from '@/shared/components'

const MyActivityScreen = () => {
  const { top } = useSafeAreaInsets()
  const [sub, setSub] = useState<ActivitySub>('applications')
  return (
    <View style={styles.screen}>
      <ScreenBar bar={{ title: '내 활동', onBack: () => router.back() }}>
        {({ topInset, onScroll }) => <ActivityTab sub={sub} onSub={setSub} top={Math.max(topInset - top, 0)} onScroll={onScroll} />}
      </ScreenBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
}))

export default MyActivityScreen
