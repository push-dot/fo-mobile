import { router } from 'expo-router'
import { memo, useCallback, useMemo, type ReactElement } from 'react'
import { ActivityIndicator, FlatList, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
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
  /** Space for a header floating over the list, and its scroll listener. */
  topInset?: number
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const Gap = () => <View style={{ height: 22 }} />

const GridCard = ({ posting, width, onBookmark }: { posting: Posting; width: number; onBookmark: (p: Posting) => void }) => (
  <JobCard posting={posting} width={width} onPress={() => router.push(`/postings/${posting.id}`)} onBookmark={() => onBookmark(posting)} />
)
const MemoGridCard = memo(GridCard)

const PostingGrid = ({ filters, header, onReset, topInset = 0, onScroll }: Props) => {
  const { width } = useWindowDimensions()
  const cardWidth = gridCardWidth(width)
  const q = usePostingPages(filters)
  const toggleBookmark = useToggleBookmark()
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.data) ?? [], [q.data])
  const renderItem = useCallback(({ item }: { item: Posting }) => <MemoGridCard posting={item} width={cardWidth} onBookmark={toggleBookmark} />, [cardWidth, toggleBookmark])
  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      // The screen's ScreenBar floats over the list and passes its own height as topInset; an automatic inset would add the status bar on top of it (61pt after a sheet was dismissed).
      contentInsetAdjustmentBehavior="never"
      ListHeaderComponent={header}
      columnWrapperStyle={{ gap: spacing[3], paddingHorizontal: spacing[5] }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: topInset, paddingBottom: 32 }}
      onScroll={onScroll}
      scrollEventThrottle={64}
      ItemSeparatorComponent={Gap}
      renderItem={renderItem}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        q.isPending ? (
          <PostingGridSkeleton cardWidth={gridFillWidth(width)} />
        ) : q.isError ? (
          <StatusNote lines={['공고를 불러오지 못했어요.', '잠시 후 다시 열어 주세요.']} style={emptyNoteStyle(160)} />
        ) : (
          <StatusNote
            lines={JOBS_EMPTY_LINES}
            action={onReset ? { label: RESET_FILTERS_LABEL, onPress: onReset } : undefined}
            style={emptyNoteStyle(160)}
          />
        )
      }
      ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ marginTop: spacing[2] }} /> : undefined}
    />
  )
}

export default PostingGrid
