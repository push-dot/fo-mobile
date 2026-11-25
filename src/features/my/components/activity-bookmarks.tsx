import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { careerLabel } from '@push/shared'
import { Icon, Text } from '@/shared/components'
import { hitSlopTo, useColors } from '../../../theme'
import { useMyBookmarks } from '../api/hooks'
import { ACTIVITY_LIST_PAD } from '../constants'
import { emptyCta } from '../utils'
import Empty, { TAB_EMPTY_LIFT } from './empty'
import ListSkeleton from './list-skeleton'
import ListTitle from './list-title'
import Logo from './logo'

const EMPTY_LIFT = TAB_EMPTY_LIFT - ACTIVITY_LIST_PAD

const ActivityBookmarks = () => {
  const c = useColors()
  const { query, unbookmark } = useMyBookmarks()
  const { data, isLoading } = query
  if (isLoading) return <ListSkeleton />
  const list = (data?.data ?? []).filter(
    (p) => !(unbookmark.isPending && unbookmark.variables?.id === p.id),
  )
  return (
    <>
      {list.length === 0 ? (
        <Empty
          text={emptyCta('bookmarks').title}
          lift={EMPTY_LIFT}
          action={emptyCta('bookmarks').action}
          onAction={() => router.push(emptyCta('bookmarks').href)}
        />
      ) : (
        <ListTitle title="북마크한 공고" count={data?.page.total ?? list.length} />
      )}
      {list.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`${p.company} ${p.title}`}
          onPress={() => router.push(`/postings/${p.id}?from=bookmark`)}
          style={styles.bookmark}
        >
          <Logo name={p.company} size={56} />
          <View style={styles.bookmarkBody}>
            <Text v="c1" weight="600" color="t3">
              {p.company}
            </Text>
            <Text v="b1" weight="700" numberOfLines={1}>
              {p.title}
            </Text>
            <Text v="c1" color="t3">
              {p.location} · {careerLabel(p)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="북마크 해제"
            accessibilityState={{ selected: true }}
            onPress={() => unbookmark.mutate(p)}
            hitSlop={hitSlopTo(20)}
            style={styles.unbookmark}
          >
            <Icon name="bookmark" size={20} color={c.acText} filled />
          </Pressable>
        </Pressable>
      ))}
    </>
  )
}

const styles = StyleSheet.create((theme) => ({
  bookmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  bookmarkBody: { flex: 1, minWidth: 0, gap: 1 },
  unbookmark: { width: 20, height: 20 },
}))

export default ActivityBookmarks
