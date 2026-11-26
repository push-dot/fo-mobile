import { useState } from 'react'
import { LegendList } from '@legendapp/list/react-native'
import { Pressable, ScrollView, View } from 'react-native'
import type { Post, Posting, Profile } from '@push/api-client'
import { formatCount } from '@/features/jobs'
import {
  chipCount,
  PersonRow,
  PostingRow,
  PostRow,
  SEARCH_EMPTY,
  SEARCH_ERROR_LINES,
  SEARCH_RETRY_LABEL,
  SEARCH_SKELETON,
  SEARCH_SORTS,
  SearchBar,
  TABS,
  useRecentSearches,
  useSearch,
  useSearchCounts,
  useSearchQuery,
  useTrending,
  type SearchSort,
  type SearchTab,
} from '@/features/search'
import { Chip, Icon, Menu, Skeleton, SkeletonRows, StatusNote, Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'

const SearchScreen = ({ initialTab = 'postings' }: { initialTab?: SearchTab }) => {
  const { text, q, setText, search } = useSearchQuery()
  const [tab, setTab] = useState<SearchTab>(initialTab)
  const [sort, setSort] = useState<SearchSort>('relevance')
  const recent = useRecentSearches()
  const popular = useTrending().data?.terms ?? []
  const results = {
    postings: useSearch(q, 'postings', sort, tab === 'postings'),
    people: useSearch(q, 'people', sort, tab === 'people'),
    posts: useSearch(q, 'posts', sort, tab === 'posts'),
  }
  const counts = useSearchCounts(q).data
  const active = results[tab]
  const activeTab = TABS.find((t) => t.key === tab)!
  const loading = active.isPending || active.isPlaceholderData
  const pageItems = active.data?.pages.flatMap((p): (Posting | Profile | Post)[] => p.data) ?? []
  const items = loading ? [] : pageItems
  const totalOf = (k: SearchTab) => results[k].data?.pages[0]?.page.total
  const remember = () => {
    if (q) recent.add(q)
  }
  const renderItem = ({ item }: { item: Posting | Profile | Post }) =>
    'userId' in item ? (
      <PersonRow p={item} q={q} onOpen={remember} />
    ) : 'company' in item ? (
      <PostingRow p={item} q={q} onOpen={remember} />
    ) : (
      <PostRow p={item} q={q} onOpen={remember} />
    )
  const submit = () => {
    search(text)
    if (text.trim()) recent.add(text.trim())
  }

  return (
    <View style={styles.root}>
      <SearchBar value={text} onChange={setText} onSubmit={submit} />
      {!q ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {recent.terms.length ? (
            <>
              <View style={styles.recentHeader}>
                <Text v="h3" accessibilityRole="header">
                  최근 검색
                </Text>
                <Pressable accessibilityRole="button" onPress={recent.clear} hitSlop={12}>
                  <Text v="c1" weight="600" color="t3">
                    모두 지우기
                  </Text>
                </Pressable>
              </View>
              {recent.terms.map((t) => (
                <View key={t} style={styles.recentRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => search(t)}
                    style={styles.recentTerm}
                  >
                    <Icon name="clock" size={18} color="t3" />
                    <Text v="b1" style={styles.flex} numberOfLines={1}>
                      {t}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t} 지우기`}
                    onPress={() => recent.remove(t)}
                    style={styles.removeButton}
                  >
                    <Icon name="x" size={16} color="t4" />
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}
          {popular.length ? (
            <Text v="h3" accessibilityRole="header" style={styles.popularTitle}>
              지금 많이 찾는 검색어
            </Text>
          ) : null}
          <View style={styles.popularGrid}>
            {popular.map(({ term: t }, i) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1}위 ${t}`}
                onPress={() => {
                  search(t)
                  recent.add(t)
                }}
                style={styles.popularItem}
              >
                <Text v="b1" weight="700" style={styles.rank}>
                  {i + 1}
                </Text>
                <Text v="b1" numberOfLines={1} style={styles.flex}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <LegendList<Posting | Profile | Post>
          data={items}
          keyExtractor={(x) => ('userId' in x ? x.userId : x.id)}
          getItemType={(x) => ('userId' in x ? 'person' : 'company' in x ? 'posting' : 'post')}
          recycleItems
          estimatedItemSize={96}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          onEndReached={() => active.hasNextPage && !active.isFetchingNextPage && active.fetchNextPage()}
          ListHeaderComponent={
            <>
              <View style={styles.tabs}>
                {TABS.map((t) => {
                  const n = chipCount(results[t.key], counts?.[t.key])
                  return <Chip key={t.key} label={n === undefined ? t.label : `${t.label} ${formatCount(n)}`} on={tab === t.key} onPress={() => setTab(t.key)} />
                })}
              </View>
              {loading ? (
                <View style={styles.summarySkeleton}>
                  <Skeleton width={120} height={12} />
                </View>
              ) : items.length ? (
                <View style={styles.summary}>
                  <Text v="c1" weight="600" color="t3" numberOfLines={1} style={styles.flex}>
                    ‘{q}’ {activeTab.label} {formatCount(totalOf(tab) ?? items.length)}{totalOf(tab) === undefined && active.hasNextPage ? '+' : ''}{activeTab.unit}
                  </Text>
                  {tab === 'postings' ? (
                    SEARCH_SORTS.length > 1 ? (
                      <Menu
                        accessibilityLabel={`정렬, ${SEARCH_SORTS.find((s) => s.key === sort)?.label}`}
                        actions={SEARCH_SORTS.map((s) => ({ key: s.key, label: s.label, selected: s.key === sort, onPress: () => setSort(s.key) }))}
                      >
                        <View style={styles.sortTrigger}>
                          <Text v="c1" weight="600" color="t2">
                            {SEARCH_SORTS.find((s) => s.key === sort)?.label}
                          </Text>
                          <Icon name="down" size={14} color="t2" />
                        </View>
                      </Menu>
                    ) : (
                      <View style={styles.sortStatic}>
                        <Text v="c1" weight="600" color="t2">
                          {SEARCH_SORTS[0]?.label}
                        </Text>
                        <Icon name="down" size={14} color="t2" />
                      </View>
                    )
                  ) : null}
                </View>
              ) : null}
            </>
          }
          renderItem={renderItem}
          ListEmptyComponent={
            loading ? (
              <SkeletonRows {...SEARCH_SKELETON} />
            ) : active.isError ? (
              <StatusNote lines={SEARCH_ERROR_LINES} action={{ label: SEARCH_RETRY_LABEL, onPress: () => active.refetch() }} style={styles.error} />
            ) : active.isSuccess ? (
              <StatusNote lines={[SEARCH_EMPTY]} style={styles.error} />
            ) : undefined
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { paddingBottom: 32 },
  recentHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3], paddingBottom: theme.spacing[1] },
  recentRow: { flexDirection: 'row', alignItems: 'center' },
  recentTerm: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingLeft: theme.spacing[5], paddingVertical: theme.spacing[3] },
  flex: { flex: 1 },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing[2] },
  popularTitle: { paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[6], paddingBottom: theme.spacing[3] },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.spacing[5], columnGap: theme.spacing[3] },
  popularItem: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[3] },
  rank: { width: 16, fontVariant: ['tabular-nums'] },
  listContent: { flexGrow: 1, paddingBottom: 32 },
  tabs: { flexDirection: 'row', gap: theme.spacing[2], paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[2], paddingBottom: theme.spacing[1] },
  summarySkeleton: { paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4], paddingBottom: theme.spacing[1] },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4], paddingBottom: theme.spacing[1] },
  sortTrigger: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1], minHeight: 44 },
  sortStatic: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
  error: { flex: 1, justifyContent: 'center' },
}))

export default SearchScreen
