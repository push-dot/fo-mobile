import { View } from 'react-native'
import type { Post } from '@push/api-client'
import { Text } from '../../../shared/components'
import { categoryLabel, timeAgo } from '../utility'
import Avatar from './avatar'

const AuthorRow = ({ post, size }: { post: Post; size: number }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Avatar user={post.author} size={size} />
      <View>
        <Text v="b2" weight="700">
          {post.author.displayName}
        </Text>
        <Text v="c2" color="t3">
          {categoryLabel(post.category)} · {timeAgo(post.createdAt)}
        </Text>
      </View>
    </View>
  )
}

export default AuthorRow
