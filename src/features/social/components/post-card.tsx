import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Post } from '@push/api-client'
import { Icon, Text, WordClampText } from '../../../shared/components'
import AuthorRow from './author-row'
import ImageGrid from './image-grid'

export const openPost = (id: string) => router.push({ pathname: '/posts/[id]', params: { id } })

const PostCard = ({ post }: { post: Post }) => {
  return (
    <Pressable accessibilityRole="button" onPress={() => openPost(post.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <AuthorRow post={post} size={36} />
      <View style={styles.body}>
        <Text v="h3">{post.title}</Text>
        <WordClampText v="b2" color="t2" lines={2} ellipsis="line">
          {post.body}
        </WordClampText>
      </View>
      <ImageGrid urls={post.imageUrls} row={88} />
      <View style={styles.meta}>
        <Icon name="chat" size={16} color="t3" />
        <Text v="c1" color="t3" weight="600">
          댓글 {post.commentCount}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: { gap: theme.spacing[3], paddingVertical: theme.spacing[5], paddingHorizontal: theme.spacing[5], opacity: 1 },
  pressed: { opacity: 0.7 },
  body: { gap: theme.spacing[1] },
  meta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
}))

export default PostCard
