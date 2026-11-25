import { router } from 'expo-router'
import { Platform } from 'react-native'
import { useState } from 'react'
import { HubFilterSheet, profileQuery, useHubFilterStore, useProfileCount } from '@/features/hub'
import { IOS_FILTER_ACTION_GAP, Sheet, SHEET_ACTION_GAP, useSheetScrollMax } from '@/shared/components'

const HubFilterSheetScreen = () => {
  const category = useHubFilterStore((s) => s.category)
  const setSheet = useHubFilterStore((s) => s.setSheet)
  const [draft, setDraft] = useState(() => useHubFilterStore.getState().sheet)
  const total = useProfileCount([category, draft], profileQuery(category, draft), true)
  const sent = useProfileCount(['offers'], { explore: 'offers' }, true)
  const bound = useSheetScrollMax()
  return (
    <Sheet
      gap={Platform.OS === 'ios' ? 0 : undefined}
      slimAction={Platform.OS === 'ios'}
      actionGap={Platform.OS === 'ios' ? IOS_FILTER_ACTION_GAP : SHEET_ACTION_GAP.filter}
      onLayout={bound.onSheetLayout}
      action={{
        label: total === undefined ? '프로필 보기' : `프로필 ${total}개 보기`,
        onPress: () => {
          setSheet(draft)
          router.back()
        },
      }}
    >
      <HubFilterSheet draft={draft} sent={sent} onChange={setDraft} scroll={{ maxHeight: bound.maxHeight, onLayout: bound.onScrollLayout }} />
    </Sheet>
  )
}

export default HubFilterSheetScreen
