import { router } from 'expo-router'
import { useState } from 'react'
import { LegendList } from '@legendapp/list/react-native'
import { ActivityIndicator, View } from 'react-native'
import { POST_CATEGORIES, type PostCategory } from '@push/api-client'
import { Band, PostCard, PostListSkeleton, usePosts } from '@/features/social'
import { Chip, ChipRow, FloatingHeader, GlassButton, StatusNote, Text, TopBar, emptyNoteStyle, useFloatingHeader } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '@/theme'

const Separator = () => <Band />

const SocialScreen = () => {
  const [category, setCategory] = useState<PostCategory | null>(null)
  const q = usePosts(category)
  const { scrolled, onHeight, onScroll, inset } = useFloatingHeader()
  const posts = q.data?.pages.flatMap((p) => p.data) ?? []
  const renderItem = ({ item }: { item: (typeof posts)[number] }) => <PostCard post={item} />

  return (
    <View style={styles.screen}>
      <FloatingHeader scrolled={scrolled} onHeight={onHeight}>
      <TopBar
        transparent
        left={
          <Text v="h1" accessibilityRole="header">
            소셜
          </Text>
        }
        right={
          <>
            <GlassButton
              actions={[
                {
                  icon: 'search',
                  label: '검색',
                  onPress: () => router.push({ pathname: '/search', params: { tab: 'posts' } }),
                },
              ]}
            />
            <GlassButton actions={[{ icon: 'plus', label: '글쓰기', onPress: () => router.push('/(app)/(stack)/compose') }]} />
          </>
        }
      />
      </FloatingHeader>
      <LegendList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        recycleItems
        estimatedItemSize={220}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={q.isRefetching && !q.isFetchingNextPage}
        onRefresh={() => q.refetch()}
        contentContainerStyle={styles.list(inset)}
        onScroll={onScroll}
        scrollEventThrottle={64}
        showsVerticalScrollIndicator={posts.length > 0}
        ListHeaderComponent={
        <View style={styles.chips}>
          <ChipRow paddingTop={spacing[2]} paddingBottom={spacing[1]}>
            {POST_CATEGORIES.map((cat) => (
              <Chip key={cat.label} label={cat.label} on={cat.key === category} onPress={() => setCategory(cat.key)} />
            ))}
          </ChipRow>
        </View>
        }
        ListEmptyComponent={
          q.isPending ? (
            <PostListSkeleton />
          ) : (
            <StatusNote
              lines={[q.isError ? '글을 불러오지 못했어요' : '아직 올라온 글이 없어요']}
              action={
                q.isError
                  ? { label: '다시 불러오기', onPress: () => q.refetch() }
                  : { label: '글쓰기', onPress: () => router.push('/(app)/(stack)/compose') }
              }
              style={emptyNoteStyle(140, false)}
            />
          )
        }
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  list: (inset: number) => ({ flexGrow: 1, paddingTop: inset }),
  chips: { marginBottom: theme.spacing[1] },
  footer: { padding: theme.spacing[5] },
}))

export default SocialScreen
