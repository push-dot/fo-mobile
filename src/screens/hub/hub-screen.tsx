import { HUB_CATEGORIES } from '@push/api-client'
import { router, type Href } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { ActivityIndicator, Platform, View } from 'react-native'
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
import { Badge, Button, Chip, ChipRow, FloatingHeader, GlassButton, SkeletonRows, StatusNote, Text, TopBar, emptyNoteStyle, useFloatingHeader } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const HEADER_GAP = Platform.OS === 'ios' ? 14 : 6

const HubScreen = () => {
  const c = useColors()
  const category = useHubFilterStore((s) => s.category)
  const sheet = useHubFilterStore((s) => s.sheet)
  const setCategory = useHubFilterStore((s) => s.setCategory)
  const reset = useHubFilterStore((s) => s.reset)

  const { scrolled, onHeight, onScroll, inset } = useFloatingHeader()
  const viewerId = useViewerId()
  const list = useProfileList(category, sheet)
  const items = list.data?.pages.flatMap((p) => p.data) ?? []
  const summary = filterSummary(sheet)
  const emptyList = !list.isPending && !list.isError && items.length === 0

  const header = (
    <View>
      <ChipRow paddingTop={spacing[1]}>
        <Chip label="전체" on={category.length === 0} onPress={() => setCategory([])} />
        {HUB_CATEGORIES.map((k) => (
          <Chip key={k.key} label={k.label} on={category.includes(k.key)} onPress={() => setCategory(toggle(category, k.key))} />
        ))}
      </ChipRow>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingTop: emptyList ? spacing[2] : spacing[3], paddingBottom: spacing[1], gap: spacing[2] }}>
        {summary ? <Badge label={summary} /> : null}
        <View style={{ flex: 1 }} />
        <FilterButton onPress={() => router.push('/hub-filter')} />
      </View>
    </View>
  )

  const renderItem = ({ item }: { item: (typeof items)[number] }) => <ProfileRow p={item} />

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FloatingHeader scrolled={scrolled} onHeight={onHeight}>
      <TopBar
        transparent
        left={
          <Text v="h1" accessibilityRole="header">
            허브
          </Text>
        }
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: HEADER_GAP }}>
            {viewerId ? (
              <Button label="내 프로필" variant="secondary" size="sm" glass onPress={() => router.push(`/profiles/${viewerId}` as Href)} />
            ) : null}
            <GlassButton actions={[{ icon: 'search', label: '이름, 직무, 기술 검색', onPress: () => router.push({ pathname: '/search', params: { tab: 'people' } } as unknown as Href) }]} />
          </View>
        }
      />
      </FloatingHeader>
      <LegendList
        data={items}
        keyExtractor={(p) => p.userId}
        renderItem={renderItem}
        recycleItems
        estimatedItemSize={88}
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
        contentContainerStyle={{ flexGrow: 1, paddingTop: inset }}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll}
        scrollEventThrottle={64}
      />
    </View>
  )
}

export default HubScreen
