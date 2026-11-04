import { router } from 'expo-router'
import type { ReactElement } from 'react'
import { ActivityIndicator, FlatList, useWindowDimensions, View } from 'react-native'
import type { PostingFilters } from '@push/api-client'
import { JobCard, LoadingNote, StatusNote, Text } from '../../../shared/components'
import { usePostingPages, useToggleBookmark } from '../api/hooks'
import { JOBS_EMPTY_LINES, RESET_FILTERS_LABEL } from '../constants'

type Props = {
  filters: PostingFilters
  header?: ReactElement
  onReset?: () => void
  loadingLabel?: boolean
}

const Gap = () => <View style={{ height: 22 }} />

const PostingGrid = ({ filters, header, onReset, loadingLabel = true }: Props) => {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - 40 - 12) / 2)
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
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
      contentContainerStyle={{ paddingBottom: 32 }}
      ItemSeparatorComponent={Gap}
      renderItem={({ item }) => (
        <JobCard posting={item} width={cardWidth} onPress={() => router.push(`/postings/${item.id}`)} onBookmark={() => toggleBookmark(item)} />
      )}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        q.isPending ? (
          loadingLabel ? <LoadingNote style={{ marginTop: 40 }} /> : <ActivityIndicator style={{ marginTop: 40 }} />
        ) : q.isError ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' }}>
            <Text v="b2" color="t3">
              공고를 불러오지 못했어요. 잠시 후 다시 열어 주세요.
            </Text>
          </View>
        ) : (
          <StatusNote
            lines={JOBS_EMPTY_LINES}
            action={onReset ? { label: RESET_FILTERS_LABEL, onPress: onReset } : undefined}
            style={{ paddingTop: 40 }}
          />
        )
      }
      ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ marginTop: 8 }} /> : undefined}
    />
  )
}

export default PostingGrid
