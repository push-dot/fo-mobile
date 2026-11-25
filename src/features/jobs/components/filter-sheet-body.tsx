import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native'
import { FilterSheetNav, SheetScroll, Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { hitSlopTo, type } from '../../../theme'
import { CAREER_YEARS, EMPLOYMENT_TYPES, FILTER_TITLES, JOB_CATEGORIES } from '../constants'
import { EMPTY, toggle, toggleRegion, type FilterKey, type Filters } from '../utils'
import FilterOptions from './filter-options'
import FilterRegions from './filter-regions'
import FilterSkills from './filter-skills'

const REGION_SLOT = 44

type Props = {
  kind: FilterKey
  draft: Filters
  trending: string[]
  onChange: (filters: Filters) => void
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
  const isheet = ios && kind !== 'location'
  const reset = () => set(EMPTY[kind])
  return (
    <View style={[styles.body, (compact || isheet) && styles.tight]}>
      {isheet ? (
        <FilterSheetNav title={FILTER_TITLES[kind]} onReset={reset} />
      ) : (
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={styles.slot} />
          <Text v="h3" accessibilityRole="header" style={styles.title}>
            {FILTER_TITLES[kind]}
          </Text>
          <Pressable accessibilityRole="button" onPress={reset} hitSlop={{ ...hitSlopTo(type.c1.lineHeight), left: 12, right: 12 }} style={styles.reset}>
            <Text v="c1" weight={ios ? '400' : '700'} color={ios ? 'ac' : 'acText'}>
              초기화
            </Text>
          </Pressable>
        </View>
      )}
      {scroll && kind !== 'location' ? (
        <SheetScroll keyboardShouldPersistTaps="handled" style={styles.scroll(scroll.maxHeight)} onLayout={scroll.onLayout} contentContainerStyle={isheet ? styles.tight : styles.options}>
          {options}
        </SheetScroll>
      ) : (
        options
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  body: { gap: 14, flexGrow: 1 },
  tight: { gap: 0 },
  options: { gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCompact: { minHeight: 52 },
  slot: { width: REGION_SLOT },
  title: { flex: 1, textAlign: 'center' },
  reset: { width: REGION_SLOT, alignItems: 'flex-end' },
  scroll: (maxHeight: number) => ({ maxHeight }),
})

export default FilterSheetBody
