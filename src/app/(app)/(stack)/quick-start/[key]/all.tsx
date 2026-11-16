import { router, useLocalSearchParams } from 'expo-router'
import { QUICK_STARTS, QuickStartSheet } from '@/features/chat'

const QuickStartAllRoute = () => {
  const { key } = useLocalSearchParams<{ key: string }>()
  const qs = QUICK_STARTS.find((item) => item.key === key && !item.instant) ?? null
  return <QuickStartSheet qs={qs} onClose={() => router.back()} all />
}

export default QuickStartAllRoute
