import type { Comment, Post } from '@push/api-client'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useRef, useState, type ComponentRef, type RefObject } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../lib/api'
import { fontFor, useColors } from '../../theme'
import { Glass, Icon, Text, TopBar } from '../../ui'
import { threadComments, timeAgo } from './lib'
import { AuthorRow, Avatar, Band, ImageGrid } from './parts'

const MAX_COMMENT = 1000

function PostHeader({ post }: { post: Post }) {
  return (
    <View style={{ gap: 14, paddingTop: 4, paddingBottom: 14 }}>
      <AuthorRow post={post} size={40} />
      <Text v="h1" style={{ fontSize: 24, lineHeight: 32 }}>
        {post.title}
      </Text>
      <Text v="b1" color="t2">
        {post.body}
      </Text>
      <ImageGrid urls={post.imageUrls} row={96} />
      <Band style={{ marginHorizontal: -20, marginVertical: 6 }} />
      <Text v="h3">댓글 {post.commentCount}</Text>
    </View>
  )
}

function CommentRow({ comment, reply, onReply }: { comment: Comment; reply: boolean; onReply: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginLeft: reply ? 42 : 0, marginBottom: 14 }}>
      <Avatar user={comment.author} size={32} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text v="c1">
          <Text v="c1" weight="700">
            {comment.author.displayName}
          </Text>{' '}
          <Text v="c1" color="t3">
            {timeAgo(comment.createdAt)}
          </Text>
        </Text>
        <Text v="b2">{comment.body}</Text>
        <Pressable accessibilityRole="button" onPress={onReply} hitSlop={12} style={{ alignSelf: 'flex-start' }}>
          <Text v="c2" color="t3" weight="600">
            답글 달기
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

/** Glass comment input (flat on Android). Multi-line, 1–1000 chars. */
function Composer({ postId, replyTo, onClearReply, inputRef }: {
  postId: string
  replyTo: { id: string; name: string } | null
  onClearReply: () => void
  inputRef: RefObject<ComponentRef<typeof TextInput> | null>
}) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const ios = Platform.OS === 'ios'
  const send = useMutation({
    mutationFn: () => api.posts.comment(postId, text.trim(), replyTo?.id),
    onSuccess: () => {
      setText('')
      onClearReply()
      void qc.invalidateQueries({ queryKey: ['comments', postId] })
      void qc.invalidateQueries({ queryKey: ['post', postId] })
      void qc.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: () => Alert.alert('댓글을 남기지 못했어요', '잠시 후 다시 시도해 주세요.'),
  })
  const ok = text.trim().length > 0 && !send.isPending

  const box = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 52, padding: 6 }}>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={MAX_COMMENT}
        accessibilityLabel="댓글"
        placeholder={replyTo ? '답글을 남겨 주세요' : '댓글을 남겨 주세요'}
        placeholderTextColor={c.t4}
        style={[{ flex: 1, fontSize: 16, color: c.t1, paddingHorizontal: 4, paddingVertical: 9, minHeight: 40, maxHeight: 120 }, fontFor('400')]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="보내기"
        accessibilityState={{ disabled: !ok }}
        disabled={!ok}
        onPress={() => send.mutate()}
        hitSlop={4}
        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? c.ac : c.fill2 }}
      >
        {send.isPending ? <ActivityIndicator color={c.t4} /> : <Icon name="up" size={20} color={ok ? '#FFFFFF' : c.t4} />}
      </Pressable>
    </View>
  )

  return (
    <View
      style={{
        paddingHorizontal: ios ? 16 : 12,
        paddingTop: ios ? 6 : 8,
        paddingBottom: ios ? Math.max(insets.bottom - 6, 8) : insets.bottom + 8,
        backgroundColor: ios ? 'transparent' : c.bg,
        gap: 8,
      }}
    >
      {replyTo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
          <Text v="c1" color="t3" style={{ flex: 1 }}>
            {replyTo.name}님에게 답글 남기는 중
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="답글 취소" onPress={onClearReply} hitSlop={14}>
            <Icon name="x" size={16} color="t3" />
          </Pressable>
        </View>
      ) : null}
      {ios ? <Glass style={{ borderRadius: 26 }}>{box}</Glass> : <View style={{ borderRadius: 26, backgroundColor: c.fill }}>{box}</View>}
    </View>
  )
}

export function PostDetailScreen({ id }: { id: string }) {
  const c = useColors()
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const post = useQuery({ queryKey: ['post', id], queryFn: () => api.posts.get(id) })
  const comments = useInfiniteQuery({
    queryKey: ['comments', id],
    queryFn: ({ pageParam }) => api.posts.comments(id, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled: !!post.data,
  })
  const rows = threadComments(comments.data?.pages.flatMap((p) => p.data) ?? [])

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
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
                  // Replies stay one level deep: replying to a reply targets its root comment.
                  setReplyTo({ id: item.parentId ?? item.id, name: item.author.displayName })
                  inputRef.current?.focus()
                }}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onEndReached={() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()}
            ListFooterComponent={comments.isPending || comments.isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : undefined}
          />
          <Composer postId={id} replyTo={replyTo} onClearReply={() => setReplyTo(null)} inputRef={inputRef} />
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
