import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView } from 'react-native'
import { QUICK_STARTS, QuickStartSheet } from '@/features/chat'
import { Sheet } from '@/shared/components'

const QuickStartRoute = () => {
  const { key } = useLocalSearchParams<{ key: string }>()
  const qs = QUICK_STARTS.find((item) => item.key === key) ?? null
  return (
    <Sheet title={qs?.title}>
      <ScrollView>
        <QuickStartSheet qs={qs} embedded onClose={() => router.back()} />
      </ScrollView>
    </Sheet>
  )
}

export default QuickStartRoute
