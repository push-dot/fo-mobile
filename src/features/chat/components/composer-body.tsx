import type { AccessMode } from '@push/api-client'
import type { Ref } from 'react'
import { Pressable, TextInput, View, type TextInputInstance } from 'react-native'
import { fontFor, onAccent, radius, spacing, type, useColors } from '../../../theme'
import { Icon, Text, hitSlopTo } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import ModePicker from './mode-picker'


export type ComposerProps = {
  value: string
  onChangeText: (t: string) => void
  onSend: () => void
  placeholder: string
  /** Agent is working: the right side becomes a single black stop button. */
  working?: boolean
  onStop?: () => void
  onAttach: () => void
  onMention: () => void
  onMic: () => void
  attachment?: string
  onClearAttachment: () => void
  accessMode: AccessMode
  inputRef?: Ref<TextInputInstance>
}

/** Text line on top (17px), control row below: + 첨부 · @ 언급 … mic · send/stop. Shared by both platforms. */
export const ComposerBody = ({ inputRef, ...p }: ComposerProps) => {
  const c = useColors()
  const typed = p.value.trim()
  const hasText = typed.length > 0
  // A bare "@" only opens the suggestions; there is nothing to send yet.
  const canSend = hasText && typed !== '@'
  const round = { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } as const
  const chip = { minHeight: 40, paddingHorizontal: spacing[4], borderRadius: radius.pill, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', gap: spacing[2] } as const
  return (
    <View style={{ paddingTop: spacing[4], paddingRight: 10, paddingBottom: 10, paddingLeft: 18, gap: 14 }}>
      {p.attachment ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.attachment} 첨부 빼기`}
          onPress={p.onClearAttachment}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: c.fill, maxWidth: '90%' }}
        >
          <Icon name="paper" size={16} color="t2" />
          <Text v="c1" weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
            {p.attachment}
          </Text>
          <Icon name="x" size={12} color="t3" />
        </Pressable>
      ) : null}
      <TextInput
        ref={inputRef}
        value={p.value}
        onChangeText={p.onChangeText}
        placeholder={p.placeholder}
        placeholderTextColor={c.t4}
        multiline
        accessibilityLabel="메시지"
        style={[{ fontSize: type.h3.fontSize, lineHeight: type.h3.lineHeight, color: c.t1, maxHeight: 140, ...inputReset }, fontFor(hasText ? '600' : '400')]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Pressable accessibilityRole="button" accessibilityLabel="첨부" onPress={p.onAttach} hitSlop={hitSlopTo(40, 40)} style={[round, { backgroundColor: c.fill }]}>
          <Icon name="plus" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="언급"
          onPress={p.onMention}
          hitSlop={hitSlopTo(40)}
          style={chip}
        >
          <Icon name="at" size={16} />
          <Text v="c1" weight="600" style={{ fontSize: 14 }}>
            언급
          </Text>
        </Pressable>
        <ModePicker value={p.accessMode} style={chip} />
        <View style={{ flex: 1 }} />
        {p.working && !hasText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="중지"
            onPress={p.onStop}
            hitSlop={hitSlopTo(40, 40)}
            style={({ pressed }) => [round, { backgroundColor: c.t1, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
          >
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c.bg }} />
          </Pressable>
        ) : (
          <>
            {hasText ? null : (
              <Pressable accessibilityRole="button" accessibilityLabel="음성 입력" onPress={p.onMic} hitSlop={hitSlopTo(40, 40)} style={[round, { backgroundColor: c.fill }]}>
                <Icon name="mic" size={18} />
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="보내기"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={p.onSend}
              hitSlop={hitSlopTo(40, 40)}
              style={[round, { backgroundColor: canSend ? c.ac : c.fill2 }]}
            >
              <Icon name="up" size={20} color={canSend ? onAccent : c.t4} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  )
}
