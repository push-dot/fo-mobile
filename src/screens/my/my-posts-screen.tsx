import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { POST_CATEGORIES } from '@push/api-client'
import { Icon, Text, TopBar } from '@/shared/components'
import { timeAgo, useMyCommentedPosts, useMyPosts } from '@/features/my'
import { useColors } from '@/theme'

const MyPostsScreen = () => {
  const c = useColors()
  const { box } = useLocalSearchParams<{ box?: string }>()
  const commented = box === 'commented'
  const mine = useMyPosts()
  const replies = useMyCommentedPosts()
  const query = commented ? replies : mine
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={commented ? '댓글 단 글' : '내가 쓴 글'} onBack={() => router.back()} />
      {query.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView>
          {(query.data?.data ?? []).map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => router.push(`/posts/${p.id}`)}
              style={{ gap: 4, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: c.line }}
            >
              <Text v="c2" color="t3">
                {POST_CATEGORIES.find((k) => k.key === p.category)?.label} · {timeAgo(p.createdAt)}
              </Text>
              <Text v="b1" weight="700" numberOfLines={1}>
                {p.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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
