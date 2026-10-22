import { View } from 'react-native'
import type { Post } from '@push/api-client'
import { Text } from '../../../shared/components'
import AuthorRow from './author-row'
import Band from './band'
import ImageGrid from './image-grid'

const PostHeader = ({ post }: { post: Post }) => {
  return (
    <View style={{ gap: 14, paddingTop: 4, paddingBottom: 14 }}>
      <AuthorRow post={post} size={40} />
      <Text v="h1" style={{ fontSize: 24, lineHeight: 32 }}>
        {post.title}
      </Text>
      <Text v="b1" color="t2">
        {post.body}
      </Text>
      <ImageGrid urls={post.imageUrls} row={96} />
      <Band style={{ marginHorizontal: -20, marginVertical: 6 }} />
      <Text v="h3">댓글 {post.commentCount}</Text>
    </View>
  )
}

export default PostHeader
