import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Comment } from '@push/api-client'
import { Text } from '../../../shared/components'
import { timeAgo } from '../utils'
import Avatar from './avatar'

const CommentRow = ({ comment, reply, onReply }: { comment: Comment; reply: boolean; onReply: () => void }) => {
  return (
    <View style={[styles.row, reply && styles.reply]}>
      <Avatar user={comment.author} size={32} />
      <View style={styles.body}>
        <Text v="c1">
          <Text v="c1" weight="700">
            {comment.author.displayName}
          </Text>{' '}
          <Text v="c1" color="t3">
            {timeAgo(comment.createdAt)}
          </Text>
        </Text>
        <Text v="b2">{comment.body}</Text>
        <Pressable accessibilityRole="button" onPress={onReply} hitSlop={12} style={styles.replyButton}>
          <Text v="c2" color="t3" weight="600">
            답글 달기
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing[3], marginLeft: 0, marginBottom: theme.spacing[4] },
  reply: { marginLeft: 42 },
  body: { flex: 1, gap: theme.spacing[1] },
  replyButton: { alignSelf: 'flex-start' },
}))

export default CommentRow
