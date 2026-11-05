import { router } from 'expo-router'
import { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { FILTER_KEYS, POSTING_SORTS, PostingGrid, chipText, formatCount, isEmpty, toQuery, useJobListStore, usePostingPages, EMPTY } from '@/features/jobs'
import { Chip, GlassButton, Icon, Menu, Skeleton, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const JobListScreen = () => {
  const c = useColors()
  const filters = useJobListStore((s) => s.filters)
  const sort = useJobListStore((s) => s.sort)
  const setFilters = useJobListStore((s) => s.setFilters)
  const setSort = useJobListStore((s) => s.setSort)
  const reset = useJobListStore((s) => s.reset)
  useEffect(() => reset, [reset])
  const query = { ...toQuery(filters), sort }
  const pages = usePostingPages(query)
  const total = pages.data?.pages[0]?.page.total
  const sortLabel = POSTING_SORTS.find((s) => s.key === sort)?.label ?? '최신순'

  const header = (
    <View style={{ backgroundColor: c.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 4 }}>
        <Chip label="전체" on={isEmpty(filters)} onPress={() => setFilters(EMPTY)} />
        {FILTER_KEYS.map((k) => (
          <Chip key={k} label={chipText(k, filters)} menu on={filters[k].length > 0} onPress={() => router.push({ pathname: '/job-filter', params: { kind: k } })} />
        ))}
      </ScrollView>
      {pages.isPending ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
          <Skeleton width={80} height={12} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 }}>
          <Text v="c1" weight="600" color="t3">
            {total === undefined ? ' ' : `공고 ${formatCount(total)}개`}
          </Text>
          <Menu
            accessibilityLabel={`정렬, ${sortLabel}`}
            actions={POSTING_SORTS.map((s) => ({ key: s.key, label: s.label, selected: s.key === sort, onPress: () => setSort(s.key) }))}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44 }}>
              <Text v="c1" weight="600" color="t2">
                {sortLabel}
              </Text>
              <Icon name="down" size={14} color="t2" />
            </View>
          </Menu>
        </View>
      )}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="채용공고"
        onBack={() => router.back()}
        right={<GlassButton actions={[{ icon: 'search', label: '검색', onPress: () => router.push('/search') }]} />}
      />
      <PostingGrid filters={query} header={header} onReset={() => setFilters(EMPTY)} />
    </View>
  )
}

export default JobListScreen
