import { Slot } from 'expo-router'
import { useColdStartTermsCheck } from '@/features/auth'
import { useHomeSnapshotSync } from '@/features/home'

const AppLayout = () => {
  const ready = useHomeSnapshotSync()
  useColdStartTermsCheck()
  if (!ready) return null
  return <Slot />
}

export default AppLayout
