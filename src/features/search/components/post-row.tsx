import { router } from 'expo-router'
import { memo } from 'react'
import { Pressable, View } from 'react-native'
import type { Post } from '@push/api-client'
import { postInfo } from '@/features/social'
import { Icon, Text } from '../../../shared/components'
import { spacing, useColors } from '../../../theme'
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
      style={{ paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[1], borderBottomWidth: 1, borderBottomColor: c.line }}
    >
      <Text v="c2" color="t3" numberOfLines={1}>
        {postInfo(p)}
      </Text>
      <Text v="b1" weight="700" numberOfLines={1}>
        <Highlight text={p.title} q={q} weight="700" />
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
        <Icon name="chat" size={14} color="t3" />
        <Text v="c1" color="t3">
          댓글 {p.commentCount}
        </Text>
      </View>
    </Pressable>
  )
}

export default memo(PostRow)
