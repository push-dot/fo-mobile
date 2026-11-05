import { Pressable, View } from 'react-native'
import { CAREER_YEARS, EMPLOYMENT_TYPES, JOB_CATEGORIES } from '@push/api-client'
import { Text } from '../../../shared/components'
import { FILTER_TITLES } from '../constants'
import { EMPTY, toggle, toggleRegion, type FilterKey, type Filters } from '../utils'
import FilterOptions from './filter-options'
import FilterRegions from './filter-regions'
import FilterSkills from './filter-skills'

type Props = {
  kind: FilterKey
  draft: Filters
  trending: string[]
  onChange: (filters: Filters) => void
}

const FilterSheetBody = ({ kind, draft, trending, onChange }: Props) => {
  const set = (list: Filters[FilterKey]) => onChange({ ...draft, [kind]: list })
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text v="h2" accessibilityRole="header">
          {FILTER_TITLES[kind]}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => set(EMPTY[kind])} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
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
        <FilterSkills selected={draft.skills} trending={trending} onToggle={(s) => set(toggle(draft.skills, s))} />
      ) : (
        <FilterRegions draft={draft} onToggle={(v) => set(toggleRegion(draft.location, v))} />
      )}
    </View>
  )
}

export default FilterSheetBody
