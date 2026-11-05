import { HUB_CATEGORIES } from '@push/api-client'
import { router, type Href } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native'
import {
  FilterButton,
  HUB_SKELETON,
  ProfileRow,
  Surface,
  appliedCount,
  filterSummary,
  toggle,
  useHubFilterStore,
  useProfileList,
  useViewerId,
} from '@/features/hub'
import { Badge, Button, Chip, Icon, SkeletonRows, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const HubScreen = () => {
  const c = useColors()
  const category = useHubFilterStore((s) => s.category)
  const sheet = useHubFilterStore((s) => s.sheet)
  const setCategory = useHubFilterStore((s) => s.setCategory)
  const reset = useHubFilterStore((s) => s.reset)

  const viewerId = useViewerId()
  const list = useProfileList(category, sheet)
  const items = list.data?.pages.flatMap((p) => p.data) ?? []
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
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
        renderItem={({ item }) => <ProfileRow p={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.isPending ? (
            <SkeletonRows {...HUB_SKELETON} />
          ) : list.isError ? (
            <Text v="b2" color="t3" style={{ textAlign: 'center', marginTop: 32 }}>
              프로필을 불러오지 못했어요.
            </Text>
          ) : (
            <View style={{ alignItems: 'center', gap: 12, marginTop: 32 }}>
              <Text v="b2" color="t3">
                조건에 맞는 프로필이 없어요.
              </Text>
              <Button label="필터 초기화" variant="secondary" size="sm" onPress={reset} />
            </View>
          )
        }
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} /> : undefined}
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  )
}

export default HubScreen
