import { Slot } from 'expo-router'
import { useColdStartTermsCheck } from '@/features/auth/use-cold-start-terms-check'
import { useHomeSnapshotSync } from '@/features/home/use-home-snapshot-sync'

const AppLayout = () => {
  const ready = useHomeSnapshotSync()
  useColdStartTermsCheck()
  if (!ready) return null
  return <Slot />
}

export default AppLayout
