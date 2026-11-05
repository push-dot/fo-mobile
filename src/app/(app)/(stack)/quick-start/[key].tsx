import { router, useLocalSearchParams } from 'expo-router'
import { QUICK_STARTS, QuickStartSheet } from '@/features/chat'

const QuickStartRoute = () => {
  const { key } = useLocalSearchParams<{ key: string }>()
  const qs = QUICK_STARTS.find((item) => item.key === key) ?? null
  return <QuickStartSheet qs={qs} onClose={() => router.back()} />
}

export default QuickStartRoute
