import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { Post } from '@push/api-client'
import { Icon, Text } from '../../../shared/components'
import { spacing } from '../../../theme'
import AuthorRow from './author-row'
import ImageGrid from './image-grid'

export const openPost = (id: string) => router.push({ pathname: '/posts/[id]', params: { id } })

const PostCard = ({ post }: { post: Post }) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPost(post.id)}
      style={({ pressed }) => ({ gap: 10, paddingVertical: 18, paddingHorizontal: spacing[5], opacity: pressed ? 0.7 : 1 })}
    >
      <AuthorRow post={post} size={36} />
      <View style={{ gap: spacing[1] }}>
        <Text v="h3">{post.title}</Text>
        <Text v="b2" color="t2" numberOfLines={2}>
          {post.body}
        </Text>
      </View>
      <ImageGrid urls={post.imageUrls} row={88} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
        <Icon name="chat" size={16} color="t3" />
        <Text v="c1" color="t3" weight="600">
          댓글 {post.commentCount}
        </Text>
      </View>
    </Pressable>
  )
}

export default PostCard
