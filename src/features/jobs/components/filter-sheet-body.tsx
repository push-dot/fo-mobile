import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { CAREER_YEARS, EMPLOYMENT_TYPES, JOB_CATEGORIES } from '@push/api-client'
import { BottomSheet, Text } from '../../../shared/components'
import { usePostingCount } from '../api/hooks'
import { FILTER_TITLES } from '../constants'
import { EMPTY, formatCount, toggle, toggleRegion, type FilterKey, type Filters } from '../utils'
import FilterOptions from './filter-options'
import FilterRegions from './filter-regions'
import FilterSkills from './filter-skills'

type Props = {
  kind: FilterKey
  value: Filters
  onApply: (f: Filters) => void
  onClose: () => void
}

const FilterSheetBody = ({ kind, value, onApply, onClose }: Props) => {
  const [draft, setDraft] = useState(value)
  const set = (list: Filters[FilterKey]) => setDraft({ ...draft, [kind]: list })
  const count = usePostingCount(draft)
  const total = count.data?.page.total
  return (
    <BottomSheet
      visible
      onClose={onClose}
      action={{ label: total === undefined ? '공고 보기' : `공고 ${formatCount(total)}개 보기`, onPress: () => onApply(draft) }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text v="h2" accessibilityRole="header">
          {FILTER_TITLES[kind]}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => set(EMPTY[kind])} hitSlop={12}>
          <Text v="c1" weight="700" color="acText">
            초기화
          </Text>
        </Pressable>
      </View>
      {kind === 'category' ? (
        <FilterOptions options={JOB_CATEGORIES} selected={draft.category} onToggle={(k) => set(toggle(draft.category, k))} />
      ) : kind === 'careerYears' ? (
        <FilterOptions options={CAREER_YEARS} selected={draft.careerYears} onToggle={(k) => set(toggle(draft.careerYears, k))} />
      ) : kind === 'employmentType' ? (
        <FilterOptions options={EMPLOYMENT_TYPES} selected={draft.employmentType} onToggle={(k) => set(toggle(draft.employmentType, k))} />
      ) : kind === 'skills' ? (
        <FilterSkills selected={draft.skills} onToggle={(s) => set(toggle(draft.skills, s))} />
      ) : (
        <FilterRegions draft={draft} onToggle={(v) => set(toggleRegion(draft.location, v))} />
      )}
    </BottomSheet>
  )
}

export default FilterSheetBody
