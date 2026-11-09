import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { POST_CATEGORIES } from '@push/api-client'
import { GlassButton, Icon, Text, TopBar } from '@/shared/components'
import { Empty, emptyCta, ListSkeleton, postedAt, postsMenu, postsTitle, useMyCommentedPosts, useMyPosts, type PostsView } from '@/features/my'
import { spacing, useColors } from '@/theme'

const MyPostsScreen = () => {
  const c = useColors()
  const { box } = useLocalSearchParams<{ box?: string }>()
  const [view, setView] = useState<PostsView>(box === 'commented' ? 'commented' : 'mine')
  const mine = useMyPosts()
  const replies = useMyCommentedPosts()
  const query = view === 'commented' ? replies : mine
  const posts = query.data?.data ?? []
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title={postsTitle(view)}
        onBack={() => router.back()}
        right={<GlassButton actions={[{ icon: 'menu', label: '더 보기', menu: postsMenu(view, setView) }]} />}
      />
      {query.isLoading ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* the board's count block sits on a 16px body line box, about 4pt taller than the label's own line */}
          <Text v="c1" weight="600" color="t2" style={{ paddingTop: spacing[3], paddingBottom: spacing[1], paddingHorizontal: spacing[5] }}>
            {query.data?.page.total ?? posts.length}개
          </Text>
          {posts.length === 0 && view === 'mine' ? (
            <Empty
              text={emptyCta('posts').title}
              action={emptyCta('posts').action}
              onAction={() => router.push(emptyCta('posts').href)}
            />
          ) : null}
          {posts.map((p) => (
            <Pressable
              key={p.id}
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
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default MyPostsScreen
