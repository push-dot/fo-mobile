import { HUB_CATEGORIES } from '@push/api-client'
import { router, type Href } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native'
import {
  FilterButton,
  HUB_SKELETON,
  ProfileRow,
  appliedCount,
  filterSummary,
  toggle,
  useHubFilterStore,
  useProfileList,
  useViewerId,
} from '@/features/hub'
import { Badge, Button, Chip, Icon, SkeletonRows, StatusNote, Text, TopBar, emptyNoteStyle } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'

const HubScreen = () => {
  const c = useColors()
  const category = useHubFilterStore((s) => s.category)
  const sheet = useHubFilterStore((s) => s.sheet)
  const setCategory = useHubFilterStore((s) => s.setCategory)
  const reset = useHubFilterStore((s) => s.reset)

  const viewerId = useViewerId()
  const list = useProfileList(category, sheet)
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.data) ?? [], [list.data])
  const summary = filterSummary(sheet)

  const header = useMemo(
    () => (
    <View>
      <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[1] }}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="이름, 직무, 기술 검색"
          onPress={() => router.push({ pathname: '/search', params: { tab: 'people' } } as unknown as Href)}
        >
          <View style={{ height: 48, borderRadius: radius.pill, paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: c.fill }}>
            <Icon name="search" size={20} color="t3" />
            <Text v="b1" color="t3">
              이름, 직무, 기술 검색
            </Text>
          </View>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
        {HUB_CATEGORIES.map((k) => (
          <Chip key={k.key} label={k.label} check on={category.includes(k.key)} onPress={() => setCategory(toggle(category, k.key))} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[1], gap: spacing[2] }}>
        <Text v="h2" accessibilityRole="header">
          추천 프로필
        </Text>
        {summary ? <Badge label={summary} tone="ac" /> : null}
      </View>
    </View>
    ),
    [c.fill, category, setCategory, summary, viewerId],
  )

  const renderItem = useCallback(({ item }: { item: (typeof items)[number] }) => <ProfileRow p={item} />, [])

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        left={
          <Text v="h1" accessibilityRole="header">
            허브
          </Text>
        }
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            {viewerId ? (
              <Button label="내 프로필" variant="secondary" size="sm" onPress={() => router.push(`/profiles/${viewerId}` as Href)} />
            ) : null}
            <FilterButton count={appliedCount(sheet)} onPress={() => router.push('/hub-filter')} />
          </View>
        }
      />
      <FlatList
        data={items}
        keyExtractor={(p) => p.userId}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.isPending ? (
            <SkeletonRows {...HUB_SKELETON} />
          ) : list.isError ? (
            <Text v="b2" color="t3" style={{ textAlign: 'center', marginTop: 32 }}>
              프로필을 불러오지 못했어요.
            </Text>
          ) : (
            <StatusNote
              lines={['조건에 맞는 프로필이 없어요.']}
              action={{ label: '필터 초기화', onPress: reset }}
              style={emptyNoteStyle(140, false)}
            />
          )
        }
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: spacing[4] }} /> : undefined}
        contentContainerStyle={{ flexGrow: 1 }}
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  )
}

export default HubScreen
