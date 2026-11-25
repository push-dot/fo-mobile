import { router } from 'expo-router'
import { type ReactElement } from 'react'
import { LegendList } from '@legendapp/list/react-native'
import { ActivityIndicator, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import type { Posting, PostingFilters } from '@push/api-client'
import { JobCard, StatusNote, emptyNoteStyle } from '../../../shared/components'
import { prefetchPosting, usePostingPages, useToggleBookmark } from '../api/hooks'
import { JOBS_EMPTY_LINES, RESET_FILTERS_LABEL } from '../constants'
import { StyleSheet } from 'react-native-unistyles'
import { gridCardWidth, gridFillWidth } from '../utils/grid'
import PostingGridSkeleton from './posting-grid-skeleton'

type Props = {
  filters: PostingFilters
  header?: ReactElement
  onReset?: () => void
  topInset?: number
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const Gap = () => <View style={styles.gap} />

const GridCard = ({ posting, width, onBookmark }: { posting: Posting; width: number; onBookmark: (p: Posting) => void }) => (
  <JobCard posting={posting} width={width} onPress={() => router.push(`/postings/${posting.id}`)} onPressIn={() => prefetchPosting(posting.id)} onBookmark={() => onBookmark(posting)} />
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
      ListHeaderComponentStyle={styles.bleed}
      columnWrapperStyle={styles.columns}
      contentContainerStyle={styles.content(topInset)}
      onScroll={onScroll}
      scrollEventThrottle={64}
      ItemSeparatorComponent={Gap}
      renderItem={renderItem}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.empty}>
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
      ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={styles.more} /> : undefined}
    />
  )
}

const styles = StyleSheet.create((theme) => ({
  gap: { height: 22 },
  bleed: { marginHorizontal: -theme.spacing[5] },
  columns: { gap: theme.spacing[3] },
  content: (topInset: number) => ({ flexGrow: 1, paddingTop: topInset, paddingBottom: 32, paddingHorizontal: theme.spacing[5] }),
  empty: { marginHorizontal: -theme.spacing[5], flex: 1 },
  more: { marginTop: theme.spacing[2] },
}))

export default PostingGrid
