import { useInfiniteQuery } from '@tanstack/react-query'
import { HUB_CATEGORIES, type CareerStatus, type JobCategory, type Profile } from '@push/api-client'
import { router, type Href } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, View, type ViewStyle } from 'react-native'
import { api } from '../../lib/api'
import { useColors } from '../../theme'
import { Badge, Chip, Glass, Icon, Text, TopBar, type BadgeTone } from '../../ui'
import { Avatar } from './Avatar'
import { appliedCount, careerLine, EMPTY_SHEET, filterSummary, matchesSheet, profileQuery, statusLabel, toggle, type SheetFilters } from './filters'
import { HubFilterSheet } from './HubFilterSheet'

const STATUS_TONE: Record<CareerStatus, BadgeTone> = { seeking: 'ac', feedback: 'orange', satisfied: 'green' }

const Flat = ({ style, children }: { style: ViewStyle; children: ReactNode }) => {
  const c = useColors()
  return <View style={[{ backgroundColor: c.fill }, style]}>{children}</View>
}
// Glass on iOS, flat fill on Android (design: same layout, no glass).
const Surface = Platform.OS === 'ios' ? Glass : Flat

function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count ? `필터 ${count}개 적용됨` : '필터'}
      onPress={onPress}
    >
      <Surface style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="filter" size={22} color={count ? c.acText : c.t1} />
      </Surface>
      {count ? (
        <View style={{ position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: c.ac, borderWidth: 2, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text v="c2" weight="800" style={{ color: '#FFFFFF', fontSize: 11, lineHeight: 14 }}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

function ProfileRow({ p }: { p: Profile }) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/profiles/${p.userId}` as Href)}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: pressed ? c.fill : undefined })}
    >
      <Avatar userId={p.userId} name={p.displayName} url={p.avatarUrl} size={52} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
            {p.displayName}
          </Text>
          {p.careerStatus ? <Badge label={statusLabel(p.careerStatus)} tone={STATUS_TONE[p.careerStatus]} /> : null}
        </View>
        <Text v="b2" color="t2" numberOfLines={1}>
          {p.headline}
        </Text>
        <Text v="c1" color="t3">
          {careerLine(p)}
        </Text>
      </View>
      <View style={{ alignSelf: 'center' }}>
        <Icon name="chev" size={18} color="t4" />
      </View>
    </Pressable>
  )
}

/** 허브: 직군 chips + sheet filters over an infinite 추천 프로필 list. */
export function HubScreen() {
  const c = useColors()
  const [category, setCategory] = useState<JobCategory[]>([])
  const [sheet, setSheet] = useState<SheetFilters>(EMPTY_SHEET)
  const [filterOpen, setFilterOpen] = useState(false)

  const list = useInfiniteQuery({
    queryKey: ['profiles', 'list', category, sheet],
    queryFn: ({ pageParam }) => api.profiles.list({ ...profileQuery(category, sheet), cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })
  const items = list.data?.pages.flatMap((p) => p.data).filter((p) => matchesSheet(p, sheet)) ?? []
  const summary = filterSummary(sheet)

  const header = (
    <View>
      <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="이름, 직무, 기술 검색"
          onPress={() => router.push({ pathname: '/search', params: { tab: 'people' } } as unknown as Href)}
        >
          <Surface style={{ height: 48, borderRadius: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="search" size={20} color="t3" />
            <Text v="b1" color="t3">
              이름, 직무, 기술 검색
            </Text>
          </Surface>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 14 }}>
        {HUB_CATEGORIES.map((k) => (
          <Chip key={k.key} label={k.label} check on={category.includes(k.key)} onPress={() => setCategory(toggle(category, k.key))} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 4, gap: 8 }}>
        <Text v="h2" accessibilityRole="header">
          추천 프로필
        </Text>
        {summary ? <Badge label={summary} tone="ac" /> : null}
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        left={
          <Text accessibilityRole="header" weight="800" style={{ fontSize: 26, lineHeight: 32, letterSpacing: -0.9 }}>
            허브
          </Text>
        }
        right={<FilterButton count={appliedCount(sheet)} onPress={() => setFilterOpen(true)} />}
      />
      <FlatList
        data={items}
        keyExtractor={(p) => p.userId}
        renderItem={({ item }) => <ProfileRow p={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.isPending ? (
            <ActivityIndicator style={{ marginTop: 32 }} />
          ) : (
            <Text v="b2" color="t3" style={{ textAlign: 'center', marginTop: 32 }}>
              {list.isError ? '프로필을 불러오지 못했어요.' : '조건에 맞는 프로필이 없어요.'}
            </Text>
          )
        }
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} /> : undefined}
        contentInsetAdjustmentBehavior="automatic"
      />
      <HubFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        category={category}
        value={sheet}
        onApply={(f) => {
          setSheet(f)
          setFilterOpen(false)
        }}
      />
    </View>
  )
}
