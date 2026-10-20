import { router } from 'expo-router'
import type { ReactElement } from 'react'
import { ActivityIndicator, FlatList, useWindowDimensions, View } from 'react-native'
import type { PostingFilters } from '@push/api-client'
import { JobCard, Text } from '../../ui'
import { usePostingPages, useToggleBookmark } from './queries'

type Props = {
  filters: PostingFilters
  header?: ReactElement
}

/** 2-column infinite grid of JobCards (169 wide on a 390 screen), shared by 채용공고 and 섹션 전체보기. */
export function PostingGrid({ filters, header }: Props) {
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
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' }}>
            <Text v="b2" color="t3">
              {q.isError ? '공고를 불러오지 못했어요. 잠시 후 다시 열어 주세요.' : '조건에 맞는 공고가 없어요. 필터를 줄여 보세요.'}
            </Text>
          </View>
        )
      }
      ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ marginTop: 8 }} /> : undefined}
    />
  )
}

const Gap = () => <View style={{ height: 22 }} />

/** Total of the grid's first page, sharing its cache entry. */
export const useGridTotal = (filters: PostingFilters) => usePostingPages(filters).data?.pages[0]?.page.total
