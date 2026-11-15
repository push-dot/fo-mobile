import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native'
import { CAREER_YEARS, EMPLOYMENT_TYPES, JOB_CATEGORIES } from '@push/api-client'
import { FilterSheetNav, SheetScroll, Text } from '../../../shared/components'
import { hitSlopTo, type } from '../../../theme'
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
  /** A header over one chip group: the native sheet's 52pt header with the chips right under it. */
  compact?: boolean
  scroll?: { maxHeight: number; onLayout: (e: LayoutChangeEvent) => void }
}

const FilterSheetBody = ({ kind, draft, trending, onChange, compact, scroll }: Props) => {
  const ios = Platform.OS === 'ios'
  const set = (list: Filters[FilterKey]) => onChange({ ...draft, [kind]: list })
  const options =
    kind === 'category' ? (
      <FilterOptions options={JOB_CATEGORIES} selected={draft.category} onToggle={(k) => set(toggle(draft.category, k))} />
    ) : kind === 'careerYears' ? (
      <FilterOptions options={CAREER_YEARS} selected={draft.careerYears} onToggle={(k) => set(toggle(draft.careerYears, k))} />
    ) : kind === 'employmentType' ? (
      <FilterOptions options={EMPLOYMENT_TYPES} selected={draft.employmentType} onToggle={(k) => set(toggle(draft.employmentType, k))} />
    ) : kind === 'skills' ? (
      <FilterSkills selected={draft.skills} trending={trending} onToggle={(s) => set(toggle(draft.skills, s))} />
    ) : (
      <FilterRegions draft={draft} onToggle={(v) => set(toggleRegion(draft.location, v))} maxHeight={scroll?.maxHeight} onLayout={scroll?.onLayout} />
    )
  // iOS chip and skill sheets are the board's .isheet: the 52pt .inav, then the groups with no gap (each .ihead carries its own 14 and 6).
  const isheet = ios && kind !== 'location'
  const reset = () => set(EMPTY[kind])
  return (
    <View style={{ gap: compact || isheet ? 0 : 14, flexGrow: 1 }}>
      {isheet ? (
        <FilterSheetNav title={FILTER_TITLES[kind]} onReset={reset} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: compact ? 52 : undefined }}>
          <Text v="h2" accessibilityRole="header">
            {FILTER_TITLES[kind]}
          </Text>
          <Pressable accessibilityRole="button" onPress={reset} hitSlop={{ ...hitSlopTo(type.c1.lineHeight), left: 12, right: 12 }}>
            {/* The region sheet (.sheet2.rg) draws 13 regular in the accent; Android keeps the bold accent. */}
            <Text v="c1" weight={ios ? '400' : '700'} color={ios ? 'ac' : 'acText'}>
              초기화
            </Text>
          </Pressable>
        </View>
      )}
      {scroll && kind !== 'location' ? (
        <SheetScroll keyboardShouldPersistTaps="handled" style={{ maxHeight: scroll.maxHeight }} onLayout={scroll.onLayout} contentContainerStyle={{ gap: isheet ? 0 : 14 }}>
          {options}
        </SheetScroll>
      ) : (
        options
      )}
    </View>
  )
}

export default FilterSheetBody
