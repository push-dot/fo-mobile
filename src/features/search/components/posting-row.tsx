import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { Posting } from '@push/api-client'
import { careerLabel } from '@push/shared'
import { useToggleBookmark } from '@/features/jobs'
import { Icon, Text } from '../../../shared/components'
import { brandOf } from '../../../shared/utility'
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
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: brandOf(p.company), alignItems: 'center', justifyContent: 'center' }}>
        <Text v="h3" weight="800" style={{ color: '#FFFFFF', fontSize: 21, lineHeight: 26 }}>
          {[...p.company][0]}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text v="c1" weight="600" color="t3" numberOfLines={1}>
          <Highlight text={p.company} q={q} />
        </Text>
        <Text v="b1" weight="700" numberOfLines={1}>
          <Highlight text={p.title} q={q} />
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
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}
      >
        <Icon name="bookmark" size={22} color={p.bookmarked ? 'acText' : 't4'} filled={p.bookmarked} />
      </Pressable>
    </Pressable>
  )
}

export default PostingRow
