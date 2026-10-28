import { Pressable, View } from 'react-native'
import type { Comment } from '@push/api-client'
import { Text } from '../../../shared/components'
import { timeAgo } from '../utils'
import Avatar from './avatar'

const CommentRow = ({ comment, reply, onReply }: { comment: Comment; reply: boolean; onReply: () => void }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginLeft: reply ? 42 : 0, marginBottom: 14 }}>
      <Avatar user={comment.author} size={32} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text v="c1">
          <Text v="c1" weight="700">
            {comment.author.displayName}
          </Text>{' '}
          <Text v="c1" color="t3">
            {timeAgo(comment.createdAt)}
          </Text>
        </Text>
        <Text v="b2">{comment.body}</Text>
        <Pressable accessibilityRole="button" onPress={onReply} hitSlop={12} style={{ alignSelf: 'flex-start' }}>
          <Text v="c2" color="t3" weight="600">
            답글 달기
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export default CommentRow
