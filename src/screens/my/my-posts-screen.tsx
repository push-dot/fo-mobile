import { router, useLocalSearchParams } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { POST_CATEGORIES, type MyPostsSort } from '@push/api-client'
import { GlassButton, Icon, Text, TopBar } from '@/shared/components'
import { Empty, emptyCta, ListSkeleton, postedAt, postsMenu, postsTitle, usePostsList, type PostsView } from '@/features/my'
import { spacing, useColors } from '@/theme'

// MyPosts, MyPostsAll, MyPostsAllMenuFull and MyPostsSavedEmpty (저장한 글 with no rows: 0개 and 소셜 둘러보기).
const MyPostsScreen = () => {
  const c = useColors()
  const { box } = useLocalSearchParams<{ box?: string }>()
  const [view, setView] = useState<PostsView>(box === 'commented' || box === 'saved' ? box : 'mine')
  const [sort, setSort] = useState<MyPostsSort>('latest')
  const query = usePostsList(view, sort)
  const posts = query.data?.data ?? []
  const empty = view === 'mine' ? emptyCta('posts') : view === 'saved' ? emptyCta('saved') : null
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title={postsTitle(view)}
        onBack={() => router.back()}
        right={<GlassButton actions={[{ icon: 'more', label: '더 보기', menu: postsMenu({ view, sort }, { view: setView, sort: setSort }) }]} />}
      />
      {query.isLoading ? (
        <ListSkeleton />
      ) : (
        <LegendList
          data={posts}
          keyExtractor={(p) => p.id}
          estimatedItemSize={92}
          contentContainerStyle={{ flexGrow: 1 }}
          ListHeaderComponent={
            <Text v="c1" weight="600" color="t2" style={{ paddingTop: spacing[2], paddingBottom: spacing[1], paddingHorizontal: spacing[5] }}>
              {query.data?.page.total ?? posts.length}개
            </Text>
          }
          ListEmptyComponent={empty ? <Empty text={empty.title} action={empty.action} onAction={() => router.push(empty.href)} /> : null}
          renderItem={({ item: p }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/posts/${p.id}`)}
              style={{ gap: spacing[1], paddingVertical: spacing[3], paddingHorizontal: spacing[5], borderBottomWidth: 1, borderBottomColor: c.line }}
            >
              <Text v="c2" color="t3">
                {POST_CATEGORIES.find((k) => k.key === p.category)?.label} · {postedAt(p.createdAt)}
              </Text>
              <Text v="b1" weight="700" numberOfLines={1}>
                {p.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                  <Icon name="chat" size={14} color="t3" />
                  <Text v="c1" color="t3">
                    댓글 {p.commentCount}
                  </Text>
                </View>
                <Text v="c1" color="t3">
                  조회 {p.viewCount}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

export default MyPostsScreen
