import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Post } from '@push/api-client'
import { postInfo } from '@/features/social'
import { Highlight, Icon, Text } from '../../../shared/components'

const PostRow = ({ p, q, onOpen }: { p: Post; q: string; onOpen: () => void }) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onOpen()
        router.push(`/posts/${p.id}`)
      }}
      style={styles.row}
    >
      <Text v="c2" color="t3" numberOfLines={1}>
        {postInfo(p)}
      </Text>
      <Text v="b1" weight="700" numberOfLines={1}>
        <Highlight text={p.title} q={q} weight="700" />
      </Text>
      <View style={styles.meta}>
        <Icon name="chat" size={14} color="t3" />
        <Text v="c1" color="t3">
          댓글 {p.commentCount}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
}))

export default PostRow
