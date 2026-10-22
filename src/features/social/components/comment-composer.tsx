import { useState, type ComponentRef, type RefObject } from 'react'
import { ActivityIndicator, Platform, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Glass, Icon, Text } from '../../../shared/components'
import { fontFor, useColors } from '../../../theme'
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
  const [text, setText] = useState('')
  const ios = Platform.OS === 'ios'
  const send = useCreateComment(postId, () => {
    setText('')
    onClearReply()
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
        onPress={() => send.mutate({ text, parentId: replyTo?.id })}
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

export default CommentComposer
