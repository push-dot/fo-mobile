import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Post } from '@push/api-client'
import { Text } from '../../../shared/components'
import AuthorRow from './author-row'
import Band from './band'
import ImageGrid from './image-grid'

const PostHeader = ({ post }: { post: Post }) => {
  return (
    <View style={styles.header}>
      <AuthorRow post={post} size={40} showViews />
      <Text v="h1" style={styles.title}>
        {post.title}
      </Text>
      {post.body.split(/\n{2,}/).map((paragraph, i) => (
        <Text key={i} v="b1" color="t2">
          {paragraph}
        </Text>
      ))}
      <ImageGrid urls={post.imageUrls} row={96} />
      <Band style={styles.band} />
      <Text v="h3">댓글 {post.commentCount}</Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  header: { gap: theme.spacing[4], paddingTop: theme.spacing[1], paddingBottom: theme.spacing[4] },
  title: { fontSize: 24, lineHeight: 32 },
  band: { marginHorizontal: -theme.spacing[5], marginVertical: 6 },
}))

export default PostHeader
