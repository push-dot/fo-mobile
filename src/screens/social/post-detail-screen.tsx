import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useRef, useState, type ComponentRef } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, TextInput, View } from 'react-native'
import {
  CommentComposer,
  CommentRow,
  PostHeader,
  postShareMessage,
  postUrl,
  saveMenuAction,
  threadComments,
  useComments,
  usePost,
  useTogglePostSave,
} from '@/features/social'
import { TOAST_ABOVE, Text, NativeTopBar, showToast } from '@/shared/components'
import { copyText, shareMessage } from '@/shared/infrastructure'
import { StyleSheet } from 'react-native-unistyles'

const PostDetailScreen = ({ id }: { id: string }) => {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const post = usePost(id)
  const toggleSave = useTogglePostSave(id)
  const comments = useComments(id, !!post.data)
  const rows = threadComments(comments.data?.pages.flatMap((p) => p.data) ?? [])
  const renderComment = ({ item }: { item: (typeof rows)[number] }) => (
    <CommentRow
      comment={item}
      reply={item.reply}
      onReply={() => {
        setReplyTo({ id: item.parentId ?? item.id, name: item.author.displayName })
        inputRef.current?.focus()
      }}
    />
  )

  return (
    <View style={styles.screen}>
      <NativeTopBar
        onBack={() => router.back()}
        actions={[
          {
            icon: 'more',
            label: '더 보기',
            menu: [
              {
                key: 'save',
                actions: [
                  saveMenuAction(!!post.data?.saved, () => toggleSave.mutate(!post.data?.saved)),
                ],
              },
              {
                key: 'send',
                actions: [
                  {
                    key: 'share',
                    label: '공유하기',
                    systemImage: 'square.and.arrow.up',
                    onPress: () => void shareMessage({ message: postShareMessage(id, post.data) }),
                  },
                  {
                    key: 'copy',
                    label: '링크 복사',
                    systemImage: 'link',
                    onPress: () =>
                      void copyText(postUrl(id)).then(
                        () => showToast({ message: '링크를 복사했어요', bottom: TOAST_ABOVE.cta }),
                        () => undefined,
                      ),
                  },
                ],
              },
            ],
          },
        ]}
      />
      {post.data ? (
        <KeyboardAvoidingView style={styles.body} behavior="padding">
          <LegendList
            data={rows}
            recycleItems
            estimatedItemSize={88}
            keyExtractor={(r) => r.id}
            ListHeaderComponent={<PostHeader post={post.data} />}
            renderItem={renderComment}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onEndReached={() =>
              comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()
            }
            ListFooterComponent={
              comments.isPending || comments.isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} />
              ) : undefined
            }
          />
          <CommentComposer
            postId={id}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
            inputRef={inputRef}
          />
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.center}>
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

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1 },
  list: { paddingHorizontal: theme.spacing[5], paddingBottom: theme.spacing[4] },
  footer: { padding: theme.spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
}))

export default PostDetailScreen
