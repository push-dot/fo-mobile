import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { CHIP_FILTER_KINDS, FILTER_KEYS, FilterSheetBody, LONG_FILTER_KINDS, formatCount, useJobListStore, usePostingCount, type FilterKey } from '@/features/jobs'
import { useTrending } from '@/features/search'
import { Platform } from 'react-native'
import { IOS_FILTER_ACTION_GAP, Sheet, SHEET_ACTION_GAP, useSheetScrollMax } from '@/shared/components'

const kindOf = (value: string | string[] | undefined) => {
  const kind = Array.isArray(value) ? value[0] : value
  return FILTER_KEYS.includes(kind as FilterKey) ? (kind as FilterKey) : null
}

const CHIP_SHEET_ACTION_GAP = 26

const JobFilterSheetScreen = () => {
  const params = useLocalSearchParams<{ kind?: string }>()
  const kind = kindOf(params.kind)
  const [draft, setDraft] = useState(() => useJobListStore.getState().filters)
  const setFilters = useJobListStore((s) => s.setFilters)
  const count = usePostingCount(draft)
  const total = count.data?.page.total
  const trending = useTrending().data?.skills.map((s) => s.id) ?? []
  // The region list is drawn at its full 12 rows (FilterRegion), so its bound is the room on screen, not 60% of it.
  const bound = useSheetScrollMax(kind === 'location' ? 1 : 0.6)

  useEffect(() => {
    if (!kind) router.back()
  }, [kind])

  if (!kind) return null
  const compact = CHIP_FILTER_KINDS.includes(kind)
  // iOS chip and skill sheets (.isheet): the .inav starts 17 under the sheet top, the CTA 20 under the last chips.
  const isheet = Platform.OS === 'ios' && kind !== 'location'

  return (
    <Sheet
      // iOS chip sheets: the head starts 17 under the sheet top, the CTA (52 high, slimAction) sits 20 under the chips and the sheet
      // ends 26 under it, so FilterRole is 247 high with the CTA centre at 814.
      gap={compact || isheet ? 0 : undefined}
      slimAction={isheet}
      actionGap={isheet ? IOS_FILTER_ACTION_GAP : compact ? CHIP_SHEET_ACTION_GAP : SHEET_ACTION_GAP.filter}
      onLayout={bound.onSheetLayout}
      action={{
        label: total === undefined ? '공고 보기' : `공고 ${formatCount(total)}개 보기`,
        onPress: () => {
          setFilters(draft)
          router.back()
        },
      }}
    >
      <FilterSheetBody
        kind={kind}
        draft={draft}
        trending={trending}
        onChange={setDraft}
        onClose={() => router.back()}
        compact={compact}
        scroll={LONG_FILTER_KINDS.includes(kind) ? { maxHeight: bound.maxHeight, onLayout: bound.onScrollLayout } : undefined}
      />
    </Sheet>
  )
}

export default JobFilterSheetScreen
