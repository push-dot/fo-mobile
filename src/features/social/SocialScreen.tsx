import { POST_CATEGORIES, type Post, type PostCategory } from '@push/api-client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native'
import { api } from '../../lib/api'
import { useColors } from '../../theme'
import { Button, Chip, GlassButton, Icon, Text, TopBar } from '../../ui'
import { AuthorRow, Band, ImageGrid } from './parts'

export const openPost = (id: string) => router.push({ pathname: '/(tabs)/(social)/posts/[id]', params: { id } })

function PostCard({ post }: { post: Post }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPost(post.id)}
      style={({ pressed }) => ({ gap: 10, paddingVertical: 18, paddingHorizontal: 20, opacity: pressed ? 0.7 : 1 })}
    >
      <AuthorRow post={post} size={36} />
      <View style={{ gap: 4 }}>
        <Text v="h3">{post.title}</Text>
        <Text v="b2" color="t2" numberOfLines={2}>
          {post.body}
        </Text>
      </View>
      <ImageGrid urls={post.imageUrls} row={88} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name="chat" size={16} color="t3" />
        <Text v="c1" color="t3" weight="600">
          댓글 {post.commentCount}
        </Text>
      </View>
    </Pressable>
  )
}

export function SocialScreen() {
  const c = useColors()
  const [category, setCategory] = useState<PostCategory | null>(null)
  const q = useInfiniteQuery({
    queryKey: ['posts', category],
    queryFn: ({ pageParam }) => api.posts.list(category, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })
  const posts = q.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        left={
          <Text v="h1" accessibilityRole="header" style={{ fontSize: 26, lineHeight: 32, letterSpacing: -0.9 }}>
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
                  onPress: () => router.push({ pathname: '/(tabs)/(home)/search', params: { tab: 'posts' } }),
                },
              ]}
            />
            <GlassButton actions={[{ icon: 'edit', label: '글쓰기', onPress: () => router.push('/(tabs)/(social)/compose') }]} />
          </>
        }
      />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6 }}
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
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
            {q.isPending ? (
              <ActivityIndicator />
            ) : q.isError ? (
              <>
                <Text v="b2" color="t3">
                  글을 불러오지 못했어요
                </Text>
                <Button label="다시 불러오기" variant="secondary" size="sm" onPress={() => q.refetch()} />
              </>
            ) : (
              <Text v="b2" color="t3">
                아직 올라온 글이 없어요
              </Text>
            )}
          </View>
        }
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} /> : undefined}
      />
    </View>
  )
}
