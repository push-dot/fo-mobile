import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FILTER_KEYS, FULL_SHEET_KIND, FilterSheetBody, LONG_FILTER_KINDS, formatCount, useJobListStore, usePostingCount, type FilterKey } from '@/features/jobs'
import { useTrending } from '@/features/search'
import { Sheet, useSheetScrollMax } from '@/shared/components'

const kindOf = (value: string | string[] | undefined) => {
  const kind = Array.isArray(value) ? value[0] : value
  return FILTER_KEYS.includes(kind as FilterKey) ? (kind as FilterKey) : null
}

const JobFilterSheetScreen = () => {
  const params = useLocalSearchParams<{ kind?: string }>()
  const kind = kindOf(params.kind)
  const [draft, setDraft] = useState(() => useJobListStore.getState().filters)
  const setFilters = useJobListStore((s) => s.setFilters)
  const count = usePostingCount(draft)
  const total = count.data?.page.total
  const trending = useTrending().data?.skills.map((s) => s.id) ?? []
  const bound = useSheetScrollMax(0.6)

  useEffect(() => {
    if (!kind) router.back()
  }, [kind])

  if (!kind) return null
  const full = kind === FULL_SHEET_KIND

  return (
    <Sheet
      full={full}
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
        scroll={LONG_FILTER_KINDS.includes(kind) && !full ? { maxHeight: bound.maxHeight, onLayout: bound.onScrollLayout } : undefined}
      />
    </Sheet>
  )
}

export default JobFilterSheetScreen
