import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, ScrollView, View } from 'react-native'
import { POST_CATEGORIES, type PostCategory } from '@push/api-client'
import { Band, PostCard, PostListSkeleton, usePosts } from '@/features/social'
import { Chip, GlassButton, StatusNote, Text, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const SocialScreen = () => {
  const c = useColors()
  const [category, setCategory] = useState<PostCategory | null>(null)
  const q = usePosts(category)
  const posts = q.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        left={
          <Text v="h1" accessibilityRole="header">
            소셜
          </Text>
        }
        right={
          <>
            <GlassButton
              actions={[
                {
                  icon: 'search',
                  label: '검색',
                  onPress: () => router.push({ pathname: '/search', params: { tab: 'posts' } }),
                },
              ]}
            />
            <GlassButton actions={[{ icon: 'edit', label: '글쓰기', onPress: () => router.push('/(app)/(stack)/(tabs)/(social)/compose') }]} />
          </>
        }
      />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[1], paddingBottom: 6 }}
        >
          {POST_CATEGORIES.map((cat) => (
            <Chip key={cat.label} label={cat.label} on={cat.key === category} onPress={() => setCategory(cat.key)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={Band}
        contentInsetAdjustmentBehavior="automatic"
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={q.isRefetching && !q.isFetchingNextPage}
        onRefresh={() => q.refetch()}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          q.isPending ? (
            <PostListSkeleton />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 140 }}>
              <StatusNote
                lines={[q.isError ? '글을 불러오지 못했어요' : '아직 올라온 글이 없어요']}
                action={
                  q.isError
                    ? { label: '다시 불러오기', onPress: () => q.refetch() }
                    : { label: '글쓰기', onPress: () => router.push('/(app)/(stack)/(tabs)/(social)/compose') }
                }
              />
            </View>
          )
        }
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ padding: spacing[5] }} /> : undefined}
      />
    </View>
  )
}

export default SocialScreen
