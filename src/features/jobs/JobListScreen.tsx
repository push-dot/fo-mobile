import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useColors } from '../../theme'
import { Chip, GlassButton, Icon, Text, TopBar } from '../../ui'
import { FilterSheet } from './FilterSheet'
import { EMPTY, chipText, formatCount, isEmpty, toQuery, type FilterKey, type Filters } from './filters'
import { PostingGrid, useGridTotal } from './PostingGrid'

const KEYS: FilterKey[] = ['category', 'skills', 'careerYears', 'location', 'employmentType']

/** 채용공고 · 전체 목록: filter chips → sheets, "공고 N개 · 최신순", 2-column infinite grid. */
export function JobListScreen() {
  const c = useColors()
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [open, setOpen] = useState<FilterKey | null>(null)
  const query = { ...toQuery(filters), sort: 'latest' as const }
  const total = useGridTotal(query)

  const header = (
    <View style={{ backgroundColor: c.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 4 }}>
        <Chip label="전체" on={isEmpty(filters)} onPress={() => setFilters(EMPTY)} />
        {KEYS.map((k) => (
          <Chip key={k} label={chipText(k, filters)} menu on={filters[k].length > 0} onPress={() => setOpen(k)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 }}>
        <Text v="c1" weight="600" color="t3">
          {total === undefined ? ' ' : `공고 ${formatCount(total)}개`}
        </Text>
        {/* Only one order exists for now (feature-spec 3.3), so this is a label, not a menu. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text v="c1" weight="600" color="t2">
            최신순
          </Text>
          <Icon name="down" size={14} color="t2" />
        </View>
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="채용공고"
        onBack={() => router.back()}
        right={<GlassButton actions={[{ icon: 'search', label: '검색', onPress: () => router.push('/search') }]} />}
      />
      <PostingGrid filters={query} header={header} />
      <FilterSheet
        kind={open}
        value={filters}
        onClose={() => setOpen(null)}
        onApply={(f) => {
          setFilters(f)
          setOpen(null)
        }}
      />
    </View>
  )
}
