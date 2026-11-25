import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Posting } from '@push/api-client'
import { brandColor, careerLabel } from '@push/shared'
import { useToggleBookmark } from '@/features/jobs'
import { Highlight, Icon, Text } from '../../../shared/components'
import { onAccent } from '../../../theme'

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
      style={styles.row}
    >
      <View style={styles.logo(brandColor(p.company))}>
        <Text v="h3" weight="800" style={styles.initial}>
          {[...p.company][0]}
        </Text>
      </View>
      <View style={styles.body}>
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

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4], paddingHorizontal: theme.spacing[5], paddingVertical: theme.spacing[3] },
  logo: (brand: string) => ({ width: 56, height: 56, borderRadius: theme.radius.md, backgroundColor: brand, alignItems: 'center', justifyContent: 'center' }),
  initial: { color: onAccent, fontSize: 21, lineHeight: 26 },
  body: { flex: 1, minWidth: 0, gap: 1 },
}))

export default PostingRow
