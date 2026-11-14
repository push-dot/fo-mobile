import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native'
import { CAREER_YEARS, EMPLOYMENT_TYPES, JOB_CATEGORIES } from '@push/api-client'
import { GlassButton, SheetScroll, Text } from '../../../shared/components'
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
  /** iOS draws a glass close button left of the centred title (the boards' native sheet header). */
  onClose: () => void
  /** A header over one chip group: the native sheet's 52pt header with the chips right under it. */
  compact?: boolean
  scroll?: { maxHeight: number; onLayout: (e: LayoutChangeEvent) => void }
}

const FilterSheetBody = ({ kind, draft, trending, onChange, onClose, compact, scroll }: Props) => {
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
  return (
    <View style={{ gap: compact ? 0 : 14, flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: compact ? 52 : undefined }}>
        {ios ? <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} /> : null}
        <Text v={ios ? 'h3' : 'h2'} accessibilityRole="header" style={ios ? { flex: 1, textAlign: 'center' } : undefined}>
          {FILTER_TITLES[kind]}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => set(EMPTY[kind])} hitSlop={{ ...hitSlopTo(type.c1.lineHeight), left: 12, right: 12 }}>
          <Text v="c1" weight="700" color="acText">
            초기화
          </Text>
        </Pressable>
      </View>
      {scroll && kind !== 'location' ? (
        <SheetScroll keyboardShouldPersistTaps="handled" style={{ maxHeight: scroll.maxHeight }} onLayout={scroll.onLayout} contentContainerStyle={{ gap: 14 }}>
          {options}
        </SheetScroll>
      ) : (
        options
      )}
    </View>
  )
}

export default FilterSheetBody
