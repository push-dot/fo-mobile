import { router } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import { FILTER_KEYS, POSTING_SORTS, PostingGrid, chipText, formatCount, isEmpty, toQuery, useJobListStore, usePostingPages, EMPTY } from '@/features/jobs'
import { Chip, ChipRow, Icon, Menu, ScreenBar, Skeleton, Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '@/theme'


const JobListScreen = () => {
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
    <View style={styles.header}>
      <ChipRow paddingTop={spacing[1]}>
        <Chip label="전체" on={isEmpty(filters)} onPress={() => setFilters(EMPTY)} />
        {FILTER_KEYS.map((k) => (
          <Chip key={k} label={chipText(k, filters)} menu on={filters[k].length > 0} onPress={() => router.push({ pathname: '/job-filter', params: { kind: k } })} />
        ))}
      </ChipRow>
      {pages.isPending ? (
        <View style={styles.loading}>
          <Skeleton width={80} height={12} />
        </View>
      ) : (
        <View style={styles.meta}>
          <Text v="c1" weight="600" color="t3">
            {total === undefined ? ' ' : `공고 ${formatCount(total)}개`}
          </Text>
          <Menu
            accessibilityLabel={`정렬, ${sortLabel}`}
            actions={POSTING_SORTS.map((s) => ({ key: s.key, label: s.label, selected: s.key === sort, onPress: () => setSort(s.key) }))}
          >
            <View style={styles.sort}>
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
    <View style={styles.screen}>
      <ScreenBar
        bar={{
          title: '채용공고',
          onBack: () => router.back(),
          actions: [{ icon: 'search', label: '검색', onPress: () => router.push('/search') }],
        }}
      >
        {({ topInset, onScroll }) => <PostingGrid filters={query} header={header} onReset={() => setFilters(EMPTY)} topInset={topInset} onScroll={onScroll} />}
      </ScreenBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  header: { backgroundColor: theme.colors.bg },
  loading: { paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[5], paddingBottom: theme.spacing[3] },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing[5], paddingTop: 7, marginBottom: -1 },
  sort: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1], minHeight: 44 },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
}))

export default JobListScreen
