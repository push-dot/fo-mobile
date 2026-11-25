import { router } from 'expo-router'
import { type ReactElement } from 'react'
import { LegendList } from '@legendapp/list/react-native'
import { ActivityIndicator, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import type { Posting, PostingFilters } from '@push/api-client'
import { JobCard, StatusNote, emptyNoteStyle } from '../../../shared/components'
import { usePostingPages, useToggleBookmark } from '../api/hooks'
import { JOBS_EMPTY_LINES, RESET_FILTERS_LABEL } from '../constants'
import { spacing } from '../../../theme'
import { gridCardWidth, gridFillWidth } from '../utils/grid'
import PostingGridSkeleton from './posting-grid-skeleton'

type Props = {
  filters: PostingFilters
  header?: ReactElement
  onReset?: () => void
  topInset?: number
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const bleed = { marginHorizontal: -spacing[5] }

const Gap = () => <View style={{ height: 22 }} />

const GridCard = ({ posting, width, onBookmark }: { posting: Posting; width: number; onBookmark: (p: Posting) => void }) => (
  <JobCard posting={posting} width={width} onPress={() => router.push(`/postings/${posting.id}`)} onBookmark={() => onBookmark(posting)} />
)

const PostingGrid = ({ filters, header, onReset, topInset = 0, onScroll }: Props) => {
  const { width } = useWindowDimensions()
  const cardWidth = gridCardWidth(width)
  const q = usePostingPages(filters)
  const toggleBookmark = useToggleBookmark()
  const items = q.data?.pages.flatMap((p) => p.data) ?? []
  const renderItem = ({ item }: { item: Posting }) => <GridCard posting={item} width={cardWidth} onBookmark={toggleBookmark} />
  return (
    <LegendList
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      recycleItems
      estimatedItemSize={cardWidth * 0.68 + 80}
      contentInsetAdjustmentBehavior="never"
      ListHeaderComponent={header}
      ListHeaderComponentStyle={bleed}
      columnWrapperStyle={{ gap: spacing[3] }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: topInset, paddingBottom: 32, paddingHorizontal: spacing[5] }}
      onScroll={onScroll}
      scrollEventThrottle={64}
      ItemSeparatorComponent={Gap}
      renderItem={renderItem}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={{ ...bleed, flex: 1 }}>
        {q.isPending ? (
          <PostingGridSkeleton cardWidth={gridFillWidth(width)} />
        ) : q.isError ? (
          <StatusNote lines={['공고를 불러오지 못했어요.', '잠시 후 다시 열어 주세요.']} style={emptyNoteStyle(160)} />
        ) : (
          <StatusNote
            lines={JOBS_EMPTY_LINES}
            action={onReset ? { label: RESET_FILTERS_LABEL, onPress: onReset } : undefined}
            style={emptyNoteStyle(160)}
          />
        )}
        </View>
      }
      ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ marginTop: spacing[2] }} /> : undefined}
    />
  )
}

export default PostingGrid
