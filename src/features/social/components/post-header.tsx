import { View } from 'react-native'
import type { Post } from '@push/api-client'
import { Text } from '../../../shared/components'
import { spacing } from '../../../theme'
import AuthorRow from './author-row'
import Band from './band'
import ImageGrid from './image-grid'

const PostHeader = ({ post }: { post: Post }) => {
  return (
    <View style={{ gap: spacing[4], paddingTop: spacing[1], paddingBottom: spacing[4] }}>
      <AuthorRow post={post} size={40} showViews />
      <Text v="h1">
        {post.title}
      </Text>
      <Text v="b1" color="t2">
        {post.body}
      </Text>
      <ImageGrid urls={post.imageUrls} row={96} />
      <Band style={{ marginHorizontal: -spacing[5], marginVertical: 6 }} />
      <Text v="h3">댓글 {post.commentCount}</Text>
    </View>
  )
}

export default PostHeader
