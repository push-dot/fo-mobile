import { HUB_CATEGORIES, type JobCategory } from '@push/api-client'
import { router, type Href } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native'
import {
  EMPTY_SHEET,
  FilterButton,
  HubFilterSheet,
  ProfileRow,
  Surface,
  appliedCount,
  filterSummary,
  matchesSheet,
  toggle,
  useProfileList,
  type SheetFilters,
} from '@/features/hub'
import { Badge, Chip, Icon, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const HubScreen = () => {
  const c = useColors()
  const [category, setCategory] = useState<JobCategory[]>([])
  const [sheet, setSheet] = useState<SheetFilters>(EMPTY_SHEET)
  const [filterOpen, setFilterOpen] = useState(false)

  const list = useProfileList(category, sheet)
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

export default HubScreen
