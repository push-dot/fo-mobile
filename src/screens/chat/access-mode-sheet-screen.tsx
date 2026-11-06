import type { AccessMode } from '@push/api-client'
import { router } from 'expo-router'
import { ACCESS_MODE_TITLE, ModeOptions, useAccessMode } from '@/features/chat'
import { Sheet } from '@/shared/components'
import { spacing } from '@/theme'

const AccessModeSheetScreen = () => {
  const { mode, pick } = useAccessMode()
  const choose = (next: AccessMode) => {
    pick(next)
    router.back()
  }
  return (
    <Sheet title={ACCESS_MODE_TITLE} gap={spacing[4]}>
      <ModeOptions value={mode} onChange={choose} />
    </Sheet>
  )
}

export default AccessModeSheetScreen
