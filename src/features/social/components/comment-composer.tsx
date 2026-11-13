import { useState, type ComponentRef, type RefObject } from 'react'
import { Platform, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Composer } from '@/features/chat'
import { Icon, Text, useKeyboardHeight } from '../../../shared/components'
import { spacing, useColors } from '../../../theme'
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
  const c = useColors()
  const insets = useSafeAreaInsets()
  const keyboardUp = useKeyboardHeight() > 0
  const [text, setText] = useState('')
  const ios = Platform.OS === 'ios'
  const send = useCreateComment(postId, () => {
    setText('')
    onClearReply()
  })
  const ok = text.trim().length > 0 && !send.isPending

  const box = (
    <Composer
      layout="inline"
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
    <View
      style={{
        paddingHorizontal: ios ? spacing[4] : spacing[3],
        paddingTop: ios ? 6 : spacing[2],
        paddingBottom: ios ? Math.max(insets.bottom - 6, spacing[2]) : (keyboardUp ? 0 : insets.bottom) + spacing[2],
        backgroundColor: ios ? 'transparent' : c.bg,
        gap: spacing[2],
      }}
    >
      {replyTo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[2] }}>
          <Text v="c1" color="t3" style={{ flex: 1 }}>
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

export default CommentComposer
