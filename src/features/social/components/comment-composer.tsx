import { useState, type ComponentRef, type RefObject } from 'react'
import { Platform, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { Composer } from '@/features/chat'
import { Icon, Text, useKeyboardHeight } from '../../../shared/components'
import { composerPadding } from '../../../shared/utility'
import { useCreateComment } from '../api/hooks'
import { MAX_COMMENT } from '../constants'

const CommentComposer = ({
  postId,
  replyTo,
  onClearReply,
  inputRef,
}: {
  postId: string
  replyTo: { id: string; name: string } | null
  onClearReply: () => void
  inputRef: RefObject<ComponentRef<typeof TextInput> | null>
}) => {
  const insets = useSafeAreaInsets()
  const keyboardUp = useKeyboardHeight() > 0
  const [text, setText] = useState('')
  const send = useCreateComment(postId, () => {
    setText('')
    onClearReply()
  })
  const ok = text.trim().length > 0 && !send.isPending

  const box = (
    <Composer
      tools={false}
      label="댓글"
      maxLength={MAX_COMMENT}
      inputRef={inputRef}
      value={text}
      onChangeText={setText}
      placeholder={replyTo ? '답글을 남겨 주세요' : '댓글을 남겨 주세요'}
      sending={send.isPending}
      onSend={() => ok && send.mutate({ text, parentId: replyTo?.id })}
    />
  )

  return (
    <View style={styles.composer(insets.bottom, keyboardUp)}>
      {replyTo ? (
        <View style={styles.reply}>
          <Text v="c1" color="t3" style={styles.replyText}>
            {replyTo.name}님에게 답글 남기는 중
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="답글 취소" onPress={onClearReply} hitSlop={14}>
            <Icon name="x" size={16} color="t3" />
          </Pressable>
        </View>
      ) : null}
      {box}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  composer: (bottom: number, keyboardUp: boolean) => ({
    ...composerPadding(Platform.OS === 'ios', bottom, keyboardUp),
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.colors.bg,
    gap: theme.spacing[2],
  }),
  reply: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing[2] },
  replyText: { flex: 1 },
}))

export default CommentComposer
