import { router } from 'expo-router'
import { FlatList, Pressable, View } from 'react-native'
import type { Posting } from '@push/api-client'
import type { SectionKind } from '@/features/jobs'
import { Icon, JobCard, LoadingNote, StatusNote, Text } from '../../../shared/components'
import { useHomePostings } from '../api/hooks'
import { SECTION_ERROR_LINES, SECTION_RETRY_LABEL } from '../constants'

const Section = ({ kind, title, onBookmark }: { kind: SectionKind; title: string; onBookmark: (posting: Posting) => void }) => {
  const q = useHomePostings(kind)
  const items = q.data?.data ?? []
  if (q.isSuccess && !items.length) return null
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 }}>
        <Text v="h2" accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 전체보기`}
          onPress={() => router.push(`/section/${kind}`)}
          hitSlop={12}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Text v="c1" weight="600" color="t3">
            전체보기
          </Text>
          <Icon name="chev" size={14} color="t3" />
        </Pressable>
      </View>
      {q.isPending ? (
        <View style={{ height: 196, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingNote />
        </View>
      ) : q.isError ? (
        <StatusNote lines={SECTION_ERROR_LINES} action={{ label: SECTION_RETRY_LABEL, onPress: () => q.refetch() }} />
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <JobCard posting={item} onPress={() => router.push(`/postings/${item.id}`)} onBookmark={() => onBookmark(item)} />
          )}
        />
      )}
    </View>
  )
}

export default Section
