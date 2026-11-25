import { router, useLocalSearchParams } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import type { MyPostsSort } from '@push/api-client'
import { Icon, Text, NativeTopBar } from '@/shared/components'
import { Empty, emptyCta, ListSkeleton, postedAt, postsMenu, postsTitle, usePostsList, type PostsView, POST_CATEGORIES } from '@/features/my'
import { StyleSheet } from 'react-native-unistyles'

const MyPostsScreen = () => {
  const { box } = useLocalSearchParams<{ box?: string }>()
  const [view, setView] = useState<PostsView>(box === 'commented' || box === 'saved' ? box : 'mine')
  const [sort, setSort] = useState<MyPostsSort>('latest')
  const query = usePostsList(view, sort)
  const posts = query.data?.data ?? []
  const empty = view === 'mine' ? emptyCta('posts') : view === 'saved' ? emptyCta('saved') : null
  return (
    <View style={styles.screen}>
      <NativeTopBar
        title={postsTitle(view)}
        onBack={() => router.back()}
        actions={[{ icon: 'more', label: '더 보기', menu: postsMenu({ view, sort }, { view: setView, sort: setSort }) }]}
      />
      {query.isLoading ? (
        <ListSkeleton />
      ) : (
        <LegendList
          data={posts}
          keyExtractor={(p) => p.id}
          estimatedItemSize={92}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text v="c1" weight="600" color="t2" style={styles.count}>
              {query.data?.page.total ?? posts.length}개
            </Text>
          }
          ListEmptyComponent={empty ? <Empty text={empty.title} action={empty.action} onAction={() => router.push(empty.href)} /> : null}
          renderItem={({ item: p }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/posts/${p.id}`)}
              style={styles.post}
            >
              <Text v="c2" color="t3">
                {POST_CATEGORIES.find((k) => k.key === p.category)?.label} · {postedAt(p.createdAt)}
              </Text>
              <Text v="b1" weight="700" numberOfLines={1}>
                {p.title}
              </Text>
              <View style={styles.meta}>
                <View style={styles.metaItem}>
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

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  list: { flexGrow: 1 },
  count: { paddingTop: theme.spacing[2], paddingBottom: theme.spacing[1], paddingHorizontal: theme.spacing[5] },
  post: { gap: theme.spacing[1], paddingVertical: theme.spacing[3], paddingHorizontal: theme.spacing[5], borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  meta: { flexDirection: 'row', gap: theme.spacing[3] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
}))

export default MyPostsScreen
