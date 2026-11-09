import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { Posting } from '@push/api-client'
import { brandColor, careerLabel } from '@push/shared'
import { useToggleBookmark } from '@/features/jobs'
import { Icon, Text } from '../../../shared/components'
import { onAccent, radius, spacing } from '../../../theme'
import Highlight from './highlight'

const PostingRow = ({ p, q, onOpen }: { p: Posting; q: string; onOpen: () => void }) => {
  const toggleBookmark = useToggleBookmark()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${p.company} ${p.title}`}
      onPress={() => {
        onOpen()
        router.push(`/postings/${p.id}`)
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingHorizontal: spacing[5], paddingVertical: spacing[3] }}
    >
      <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: brandColor(p.company), alignItems: 'center', justifyContent: 'center' }}>
        <Text v="h3" weight="800" style={{ color: onAccent, fontSize: 21, lineHeight: 26 }}>
          {[...p.company][0]}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text v="c1" weight="600" color="t3" numberOfLines={1}>
          {p.company}
        </Text>
        <Text v="b1" weight="700" numberOfLines={1}>
          <Highlight text={p.title} q={q} weight="700" />
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {p.location} · {careerLabel(p)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={p.bookmarked ? '북마크 해제' : '북마크'}
        accessibilityState={{ selected: p.bookmarked }}
        onPress={() => toggleBookmark(p)}
        hitSlop={14}
      >
        <Icon name="bookmark" size={20} color={p.bookmarked ? 'acText' : 't4'} filled={p.bookmarked} />
      </Pressable>
    </Pressable>
  )
}

export default PostingRow
