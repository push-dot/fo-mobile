import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityTab, type ActivitySub } from '@/features/my'
import { ScreenBar } from '@/shared/components'
import { useColors } from '@/theme'

const MyActivityScreen = () => {
  const c = useColors()
  const { top } = useSafeAreaInsets()
  const [sub, setSub] = useState<ActivitySub>('applications')
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBar bar={{ title: '내 활동', onBack: () => router.back() }}>
        {({ topInset, onScroll }) => <ActivityTab sub={sub} onSub={setSub} top={Math.max(topInset - top, 0)} onScroll={onScroll} />}
      </ScreenBar>
    </View>
  )
}

export default MyActivityScreen
