import { useInfiniteQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useDeferredValue, useState } from 'react'
import { ActivityIndicator, FlatList, Platform, Pressable, Text as RNText, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Post, Posting, Profile } from '@push/api-client'
import { api } from '../../lib/api'
import { matchHangul } from '../../lib/hangul-search'
import { fontFor, useColors } from '../../theme'
import { Chip, Glass, Icon, Text, brandOf, careerLabel } from '../../ui'
import { useToggleBookmark } from '../jobs/queries'
import { formatCount } from '../jobs/filters'
import { POPULAR_TERMS, useRecentSearches } from './recent'

export type SearchTab = 'postings' | 'people' | 'posts'
const TABS: { key: SearchTab; label: string }[] = [
  { key: 'postings', label: '공고' },
  { key: 'people', label: '사람' },
  { key: 'posts', label: '게시글' },
]
export const isSearchTab = (v: unknown): v is SearchTab => TABS.some((t) => t.key === v)

const useSearch = <T extends SearchTab>(q: string, type: T) =>
  useInfiniteQuery({
    queryKey: ['search', type, q],
    queryFn: ({ pageParam }) => api.search(q, type, { limit: 20, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled: q.length > 0,
  })

/** 통합 검색 (홈 · 허브 · 소셜 share it): 최근/인기 검색어, then 공고 · 사람 · 게시글 results. */
export function SearchScreen({ initialTab = 'postings' }: { initialTab?: SearchTab }) {
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
                  {/* push-be search has no total; count what's loaded ("20+") until it does. */}
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

function SearchBar({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const field = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16 }}>
      <Icon name="search" size={18} color="t3" />
      <TextInput
        autoFocus
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="회사, 직무, 기술 검색"
        placeholderTextColor={c.t3}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="검색어"
        style={[{ flex: 1, fontSize: 16, color: c.t1, paddingVertical: 0 }, fontFor('400')]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChange('')} hitSlop={12}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.t4, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={12} color={c.bg} />
          </View>
        </Pressable>
      ) : null}
    </View>
  )
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: c.bg, zIndex: 3 }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
        <View style={{ flex: 1 }}>
          {Platform.OS === 'ios' ? <Glass style={{ borderRadius: 22 }}>{field}</Glass> : <View style={{ borderRadius: 22, backgroundColor: c.fill }}>{field}</View>}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ height: 44, justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text v="b2" weight="700">
            취소
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

/** Matched part in bold accent; inherits the parent Text size (초성 hits cover whole syllables, feature-spec 0.1). */
function Highlight({ text, q }: { text: string; q: string }) {
  const c = useColors()
  const m = matchHangul(text, q)
  if (!m) return <>{text}</>
  return (
    <>
      {text.slice(0, m.start)}
      <RNText style={[{ color: c.acText }, fontFor('700')]}>{text.slice(m.start, m.end)}</RNText>
      {text.slice(m.end)}
    </>
  )
}

function PostingRow({ p, q, onOpen }: { p: Posting; q: string; onOpen: () => void }) {
  const toggleBookmark = useToggleBookmark()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${p.company} ${p.title}`}
      onPress={() => {
        onOpen()
        router.push(`/postings/${p.id}`)
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: brandOf(p.company), alignItems: 'center', justifyContent: 'center' }}>
        <Text v="h3" weight="800" style={{ color: '#FFFFFF', fontSize: 21, lineHeight: 26 }}>
          {[...p.company][0]}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text v="c1" weight="600" color="t3" numberOfLines={1}>
          <Highlight text={p.company} q={q} />
        </Text>
        <Text v="b1" weight="700" numberOfLines={1}>
          <Highlight text={p.title} q={q} />
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {p.location} · {careerLabel(p)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={p.bookmarked ? '북마크 해제' : '북마크'}
        accessibilityState={{ selected: p.bookmarked }}
        onPress={() => toggleBookmark(p)}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}
      >
        <Icon name="bookmark" size={22} color={p.bookmarked ? 'acText' : 't4'} filled={p.bookmarked} />
      </Pressable>
    </Pressable>
  )
}

function PersonRow({ p, q, onOpen }: { p: Profile; q: string; onOpen: () => void }) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onOpen()
        router.push(`/profiles/${p.userId}`)
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.acSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Text v="c1" weight="700" color="acText">
          {p.displayName.length === 3 ? p.displayName.slice(1) : p.displayName.slice(0, 2)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text v="b1" weight="700" numberOfLines={1}>
          <Highlight text={p.displayName} q={q} />
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          <Highlight text={p.headline} q={q} />
        </Text>
      </View>
    </Pressable>
  )
}

function PostRow({ p, q, onOpen }: { p: Post; q: string; onOpen: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onOpen()
        router.push(`/posts/${p.id}`)
      }}
      style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 2 }}
    >
      <Text v="b1" weight="700" numberOfLines={1}>
        <Highlight text={p.title} q={q} />
      </Text>
      <Text v="c1" color="t2" numberOfLines={1}>
        <Highlight text={p.body} q={q} />
      </Text>
      <Text v="c2" color="t3">
        {p.author.displayName} · 댓글 {p.commentCount}
      </Text>
    </Pressable>
  )
}
