import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Posting } from '@push/api-client'
import { prefetchPosting, type SectionKind } from '@/features/jobs'
import { Button, Icon, JobCard, Text } from '../../../shared/components'
import { useHomePostings } from '../api/hooks'
import { SECTION_ERROR_LINES, SECTION_RETRY_LABEL } from '../constants'
import SectionSkeleton from './section-skeleton'

const SectionCard = ({ posting, onBookmark }: { posting: Posting; onBookmark: (posting: Posting) => void }) => (
  <JobCard posting={posting} onPress={() => router.push(`/postings/${posting.id}`)} onPressIn={() => prefetchPosting(posting.id)} onBookmark={() => onBookmark(posting)} />
)

const Section = ({ kind, title, skeleton, onBookmark }: { kind: SectionKind; title: string; skeleton: boolean; onBookmark: (posting: Posting) => void }) => {
  const q = useHomePostings(kind)
  const items = q.data?.data ?? []
  if (q.isSuccess && !items.length) return null
  if (q.isPending) return skeleton ? <SectionSkeleton /> : null
  return (
    <View>
      <View style={styles.head}>
        <Text v="h2" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 전체보기`}
          onPress={() => router.push(`/section/${kind}`)}
          hitSlop={14}
          style={styles.seeAll}
        >
          <Text v="c1" weight="600" color="t3">
            전체보기
          </Text>
          <Icon name="chev" size={14} color="t3" />
        </Pressable>
      </View>
      {q.isError ? (
        <View style={styles.error}>
          <View>
            {SECTION_ERROR_LINES.map((line) => (
              <Text key={line} v="b2" color="t3" style={styles.errorLine}>
                {line}
              </Text>
            ))}
          </View>
          <Button label={SECTION_RETRY_LABEL} variant="secondary" size="pill" onPress={() => q.refetch()} />
        </View>
      ) : (
        <LegendList
          horizontal
          recycleItems
          estimatedItemSize={200}
          data={items}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SectionCard posting={item} onBookmark={onBookmark} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[3],
  },
  title: { flex: 1 },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  error: {
    marginHorizontal: theme.spacing[5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg2,
    alignItems: 'center',
    padding: theme.spacing[6],
    gap: theme.spacing[3],
  },
  errorLine: { textAlign: 'center' },
  list: { gap: 14, paddingHorizontal: theme.spacing[5] },
}))

export default Section
