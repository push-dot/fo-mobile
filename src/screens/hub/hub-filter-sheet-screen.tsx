import { router } from 'expo-router'
import { useState } from 'react'
import { HubFilterSheet, profileQuery, useHubFilterStore, useProfileCount } from '@/features/hub'
import { Sheet } from '@/shared/components'

const HubFilterSheetScreen = () => {
  const category = useHubFilterStore((s) => s.category)
  const setSheet = useHubFilterStore((s) => s.setSheet)
  const [draft, setDraft] = useState(() => useHubFilterStore.getState().sheet)
  const total = useProfileCount([category, draft], profileQuery(category, draft), true)
  const sent = useProfileCount(['offers'], { explore: 'offers' }, true)
  return (
    <Sheet
      action={{
        label: total === undefined ? '프로필 보기' : `프로필 ${total}개 보기`,
        onPress: () => {
          setSheet(draft)
          router.back()
        },
      }}
    >
      <HubFilterSheet draft={draft} sent={sent} onChange={setDraft} />
    </Sheet>
  )
}

export default HubFilterSheetScreen
