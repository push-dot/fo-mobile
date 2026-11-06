import { useDeferredValue, useState } from 'react'
import { FlatList, Pressable, ScrollView, View } from 'react-native'
import type { Post, Posting, Profile } from '@push/api-client'
import { formatCount } from '@/features/jobs'
import {
  PersonRow,
  PostingRow,
  PostRow,
  SEARCH_CLEAR_LABEL,
  SEARCH_EMPTY_BODY,
  SEARCH_ERROR_LINES,
  SEARCH_RETRY_LABEL,
  SEARCH_SKELETON,
  SEARCH_SORTS,
  SearchBar,
  searchEmptyTitle,
  TABS,
  useRecentSearches,
  useSearch,
  useTrending,
  type SearchSort,
  type SearchTab,
} from '@/features/search'
import { Chip, Icon, Menu, Skeleton, SkeletonRows, StatusNote, Text, emptyNoteStyle } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const SearchScreen = ({ initialTab = 'postings' }: { initialTab?: SearchTab }) => {
  const c = useColors()
  const [text, setText] = useState('')
  const [tab, setTab] = useState<SearchTab>(initialTab)
  const [sort, setSort] = useState<SearchSort>('relevance')
  const q = useDeferredValue(text.trim())
  const recent = useRecentSearches()
  const popular = useTrending().data?.terms ?? []
  const results = { postings: useSearch(q, 'postings', sort), people: useSearch(q, 'people', sort), posts: useSearch(q, 'posts', sort) }
  const active = results[tab]
  const items: (Posting | Profile | Post)[] = active.data?.pages.flatMap((p): (Posting | Profile | Post)[] => p.data) ?? []
  const totalOf = (k: SearchTab) => results[k].data?.pages[0]?.page.total
  const remember = () => q && recent.add(q)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SearchBar value={text} onChange={setText} onSubmit={remember} />
      {!q ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          {recent.terms.length ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[1] }}>
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
                <View key={t} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setText(t)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingLeft: spacing[5], paddingVertical: spacing[3] }}
                  >
                    <Icon name="clock" size={18} color="t3" />
                    <Text v="b1" style={{ flex: 1 }} numberOfLines={1}>
                      {t}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t} 지우기`}
                    onPress={() => recent.remove(t)}
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: spacing[2] }}
                  >
                    <Icon name="x" size={16} color="t4" />
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}
          {popular.length ? (
            <Text v="h3" accessibilityRole="header" style={{ paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[3] }}>
              지금 많이 찾는 검색어
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing[5], columnGap: spacing[3] }}>
            {popular.map(({ term: t }, i) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1}위 ${t}`}
                onPress={() => {
                  setText(t)
                  recent.add(t)
                }}
                style={{ width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] }}
              >
                <Text v="b1" weight="700" color="acText" style={{ width: 16, fontVariant: ['tabular-nums'] }}>
                  {i + 1}
                </Text>
                <Text v="b1" numberOfLines={1} style={{ flex: 1 }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList<Posting | Profile | Post>
          data={items}
          keyExtractor={(x) => ('userId' in x ? x.userId : x.id)}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          onEndReached={() => active.hasNextPage && !active.isFetchingNextPage && active.fetchNextPage()}
          ListHeaderComponent={
            <>
              <View style={{ flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[1] }}>
                {TABS.map((t) => {
                  const n = totalOf(t.key)
                  return <Chip key={t.key} label={n === undefined ? t.label : `${t.label} ${formatCount(n)}`} on={tab === t.key} onPress={() => setTab(t.key)} />
                })}
              </View>
              {active.isPending ? (
                <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[1] }}>
                  <Skeleton width={120} height={12} />
                </View>
              ) : items.length ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[1] }}>
                  <Text v="c1" weight="600" color="t3" numberOfLines={1} style={{ flex: 1 }}>
                    ‘{q}’ {TABS.find((t) => t.key === tab)!.label} {formatCount(totalOf(tab) ?? items.length)}{totalOf(tab) === undefined && active.hasNextPage ? '+' : ''}{TABS.find((t) => t.key === tab)!.unit}
                  </Text>
                  {tab === 'postings' ? (
                    SEARCH_SORTS.length > 1 ? (
                      <Menu
                        accessibilityLabel={`정렬, ${SEARCH_SORTS.find((s) => s.key === sort)?.label}`}
                        actions={SEARCH_SORTS.map((s) => ({ key: s.key, label: s.label, selected: s.key === sort, onPress: () => setSort(s.key) }))}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1], minHeight: 44 }}>
                          <Text v="c1" weight="600" color="t2">
                            {SEARCH_SORTS.find((s) => s.key === sort)?.label}
                          </Text>
                          <Icon name="down" size={14} color="t2" />
                        </View>
                      </Menu>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
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
          renderItem={({ item }) =>
            'userId' in item ? (
              <PersonRow p={item} q={q} onOpen={remember} />
            ) : 'company' in item ? (
              <PostingRow p={item} q={q} onOpen={remember} />
            ) : (
              <PostRow p={item} q={q} onOpen={remember} />
            )
          }
          ListEmptyComponent={
            active.isPending ? (
              <SkeletonRows {...SEARCH_SKELETON} />
            ) : active.isError ? (
              <StatusNote lines={SEARCH_ERROR_LINES} action={{ label: SEARCH_RETRY_LABEL, onPress: () => active.refetch() }} style={{ flex: 1, justifyContent: 'center' }} />
            ) : (
              <StatusNote
                lines={[searchEmptyTitle(q), SEARCH_EMPTY_BODY]}
                action={{ label: SEARCH_CLEAR_LABEL, onPress: () => setText('') }}
                style={emptyNoteStyle(160)}
              />
            )
          }
        />
      )}
    </View>
  )
}

export default SearchScreen
