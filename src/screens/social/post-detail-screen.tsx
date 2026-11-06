import { router } from 'expo-router'
import { useRef, useState, type ComponentRef } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { CommentComposer, CommentRow, PostHeader, postShareMessage, postUrl, threadComments, useComments, usePost } from '@/features/social'
import { Glass, Icon, Menu, Text, TopBar, showToast } from '@/shared/components'
import { copyText, shareMessage } from '@/shared/infrastructure'
import { radius, spacing, useColors } from '@/theme'

const moreButton = { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } as const

const PostDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const post = usePost(id)
  const comments = useComments(id, !!post.data)
  const rows = threadComments(comments.data?.pages.flatMap((p) => p.data) ?? [])

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        onBack={() => router.back()}
        right={
          <Menu
            accessibilityLabel="더 보기"
            actions={[
              { key: 'share', label: '공유하기', systemImage: 'square.and.arrow.up', onPress: () => void shareMessage({ message: postShareMessage(id, post.data) }) },
              {
                key: 'copy',
                label: '링크 복사',
                systemImage: 'link',
                onPress: () => void copyText(postUrl(id)).then(() => showToast({ message: '링크를 복사했어요' })),
              },
            ]}
          >
            {Platform.OS === 'ios' ? (
              <Glass interactive style={moreButton}>
                <Icon name="menu" size={22} color="t1" />
              </Glass>
            ) : (
              <View style={moreButton}>
                <Icon name="menu" size={22} color="t1" />
              </View>
            )}
          </Menu>
        }
      />
      {post.data ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            ListHeaderComponent={<PostHeader post={post.data} />}
            renderItem={({ item }) => (
              <CommentRow
                comment={item}
                reply={item.reply}
                onReply={() => {
                  setReplyTo({ id: item.parentId ?? item.id, name: item.author.displayName })
                  inputRef.current?.focus()
                }}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: spacing[4] }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onEndReached={() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()}
            ListFooterComponent={comments.isPending || comments.isFetchingNextPage ? <ActivityIndicator style={{ padding: spacing[4] }} /> : undefined}
          />
          <CommentComposer postId={id} replyTo={replyTo} onClearReply={() => setReplyTo(null)} inputRef={inputRef} />
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {post.isError ? (
            <Text v="b2" color="t3">
              게시물을 찾을 수 없어요
            </Text>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      )}
    </View>
  )
}

export default PostDetailScreen
