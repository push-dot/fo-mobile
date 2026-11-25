import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Post } from '@push/api-client'
import { Text } from '../../../shared/components'
import { authorLine } from '../utils'
import Avatar from './avatar'

const AuthorRow = ({ post, size, showViews = false }: { post: Post; size: number; showViews?: boolean }) => {
  return (
    <View style={styles.row}>
      <Avatar user={post.author} size={size} />
      <View>
        <Text v="b2" weight="700">
          {post.author.displayName}
        </Text>
        <Text v="c2" color="t3">
          {authorLine(post, showViews)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
}))

export default AuthorRow
