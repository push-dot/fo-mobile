import { router } from 'expo-router'
import type { ReactElement } from 'react'
import { ActivityIndicator, FlatList, useWindowDimensions, View } from 'react-native'
import type { PostingFilters } from '@push/api-client'
import { JobCard, StatusNote } from '../../../shared/components'
import { usePostingPages, useToggleBookmark } from '../api/hooks'
import { JOBS_EMPTY_LINES, RESET_FILTERS_LABEL } from '../constants'
import { spacing } from '../../../theme'
import PostingGridSkeleton from './posting-grid-skeleton'

type Props = {
  filters: PostingFilters
  header?: ReactElement
  onReset?: () => void
}

const Gap = () => <View style={{ height: 22 }} />

const EMPTY_NOTE = { flex: 1, justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 160 } as const

const PostingGrid = ({ filters, header, onReset }: Props) => {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - spacing[5] * 2 - spacing[3]) / 2)
  const q = usePostingPages(filters)
  const toggleBookmark = useToggleBookmark()
  const items = q.data?.pages.flatMap((p) => p.data) ?? []
  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={header}
      columnWrapperStyle={{ gap: spacing[3], paddingHorizontal: spacing[5] }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
      ItemSeparatorComponent={Gap}
      renderItem={({ item }) => (
        <JobCard posting={item} width={cardWidth} onPress={() => router.push(`/postings/${item.id}`)} onBookmark={() => toggleBookmark(item)} />
      )}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        q.isPending ? (
          <PostingGridSkeleton cardWidth={cardWidth} />
        ) : q.isError ? (
          <StatusNote lines={['공고를 불러오지 못했어요.', '잠시 후 다시 열어 주세요.']} style={EMPTY_NOTE} />
        ) : (
          <StatusNote
            lines={JOBS_EMPTY_LINES}
            action={onReset ? { label: RESET_FILTERS_LABEL, onPress: onReset } : undefined}
            style={EMPTY_NOTE}
          />
        )
      }
      ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ marginTop: spacing[2] }} /> : undefined}
    />
  )
}

export default PostingGrid
