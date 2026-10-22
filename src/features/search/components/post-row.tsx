import { router } from 'expo-router'
import { Pressable } from 'react-native'
import type { Post } from '@push/api-client'
import { Text } from '../../../shared/components'
import Highlight from './highlight'

const PostRow = ({ p, q, onOpen }: { p: Post; q: string; onOpen: () => void }) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onOpen()
        router.push(`/posts/${p.id}`)
      }}
      style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 2 }}
    >
      <Text v="b1" weight="700" numberOfLines={1}>
        <Highlight text={p.title} q={q} />
      </Text>
      <Text v="c1" color="t2" numberOfLines={1}>
        <Highlight text={p.body} q={q} />
      </Text>
      <Text v="c2" color="t3">
        {p.author.displayName} · 댓글 {p.commentCount}
      </Text>
    </Pressable>
  )
}

export default PostRow
