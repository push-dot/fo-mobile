import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { Post } from '@push/api-client'
import { postInfo } from '@/features/social'
import { Icon, Text } from '../../../shared/components'
import { useColors } from '../../../theme'
import Highlight from './highlight'

const PostRow = ({ p, q, onOpen }: { p: Post; q: string; onOpen: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onOpen()
        router.push(`/posts/${p.id}`)
      }}
      style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 4, borderBottomWidth: 1, borderBottomColor: c.line }}
    >
      <Text v="c2" color="t3" numberOfLines={1}>
        {postInfo(p)}
      </Text>
      <Text v="b1" weight="700" numberOfLines={1}>
        <Highlight text={p.title} q={q} />
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name="chat" size={14} color="t3" />
        <Text v="c1" color="t3">
          댓글 {p.commentCount}
        </Text>
      </View>
    </Pressable>
  )
}

export default PostRow
