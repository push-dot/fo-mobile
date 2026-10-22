import { useDeferredValue, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native'
import type { Post, Posting, Profile } from '@push/api-client'
import { formatCount } from '@/features/jobs'
import {
  PersonRow,
  POPULAR_TERMS,
  PostingRow,
  PostRow,
  SearchBar,
  TABS,
  useRecentSearches,
  useSearch,
  type SearchTab,
} from '@/features/search'
import { Chip, Icon, Text } from '@/shared/components'
import { useColors } from '@/theme'

const SearchScreen = ({ initialTab = 'postings' }: { initialTab?: SearchTab }) => {
  const c = useColors()
  const [text, setText] = useState('')
  const [tab, setTab] = useState<SearchTab>(initialTab)
  const q = useDeferredValue(text.trim())
  const recent = useRecentSearches()
  const results = { postings: useSearch(q, 'postings'), people: useSearch(q, 'people'), posts: useSearch(q, 'posts') }
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
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
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
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 20, paddingVertical: 12 }}
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
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                  >
                    <Icon name="x" size={16} color="t4" />
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}
          <Text v="h3" accessibilityRole="header" style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 }}>
            지금 많이 찾는 검색어
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, columnGap: 12 }}>
            {POPULAR_TERMS.map((t, i) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1}위 ${t}`}
                onPress={() => {
                  setText(t)
                  recent.add(t)
                }}
                style={{ width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
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
          contentContainerStyle={{ paddingBottom: 32 }}
          onEndReached={() => active.hasNextPage && !active.isFetchingNextPage && active.fetchNextPage()}
          ListHeaderComponent={
            <>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 }}>
                {TABS.map((t) => {
                  const n = totalOf(t.key)
                  return <Chip key={t.key} label={n === undefined ? t.label : `${t.label} ${formatCount(n)}`} on={tab === t.key} onPress={() => setTab(t.key)} />
                })}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 }}>
                <Text v="c1" weight="600" color="t3" numberOfLines={1} style={{ flex: 1 }}>
                  ‘{q}’ {TABS.find((t) => t.key === tab)!.label} {formatCount(totalOf(tab) ?? items.length)}{totalOf(tab) === undefined && active.hasNextPage ? '+' : ''}개
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text v="c1" weight="600" color="t2">
                    관련도순
                  </Text>
                  <Icon name="down" size={14} color="t2" />
                </View>
              </View>
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
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : (
              <Text v="b2" color="t3" style={{ textAlign: 'center', marginTop: 40, paddingHorizontal: 20 }}>
                {active.isError ? '검색하지 못했어요. 잠시 후 다시 시도해 주세요.' : `‘${q}’에 맞는 결과가 없어요. 다른 말로 찾아보세요.`}
              </Text>
            )
          }
        />
      )}
    </View>
  )
}

export default SearchScreen
