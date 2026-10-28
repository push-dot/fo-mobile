import type { AccessMode } from '@push/api-client'
import type { Ref } from 'react'
import { Pressable, TextInput, View, type TextInputInstance } from 'react-native'
import { fontFor, useColors } from '../../../theme'
import { Icon, Text } from '@/shared/components'
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
  onAccessMode: (mode: AccessMode) => void
  inputRef?: Ref<TextInputInstance>
}

/** Text line on top (17px), control row below: + 첨부 · @ 언급 … mic · send/stop. Shared by both platforms. */
export const ComposerBody = ({ inputRef, ...p }: ComposerProps) => {
  const c = useColors()
  const hasText = p.value.trim().length > 0
  const round = { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' } as const
  return (
    <View style={{ paddingTop: 16, paddingRight: 10, paddingBottom: 10, paddingLeft: 18, gap: 14 }}>
      {p.attachment ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.attachment} 첨부 빼기`}
          onPress={p.onClearAttachment}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.fill, maxWidth: '90%' }}
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
        style={[{ fontSize: 17, lineHeight: 24, color: c.t1, maxHeight: 140, padding: 0 }, fontFor(hasText ? '600' : '400')]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="첨부" onPress={p.onAttach} style={[round, { backgroundColor: c.fill }]}>
          <Icon name="plus" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="언급"
          onPress={p.onMention}
          style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Icon name="at" size={18} />
          <Text v="c1" weight="600" style={{ fontSize: 14 }}>
            언급
          </Text>
        </Pressable>
        <ModePicker value={p.accessMode} onChange={p.onAccessMode} />
        <View style={{ flex: 1 }} />
        {p.working && !hasText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="중지"
            onPress={p.onStop}
            style={({ pressed }) => [round, { backgroundColor: c.t1, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
          >
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c.bg }} />
          </Pressable>
        ) : (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="음성 입력" onPress={p.onMic} style={[round, { backgroundColor: c.fill }]}>
              <Icon name="mic" size={20} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="보내기"
              accessibilityState={{ disabled: !hasText }}
              disabled={!hasText}
              onPress={p.onSend}
              style={[round, { backgroundColor: hasText ? c.ac : c.fill2 }]}
            >
              <Icon name="up" size={20} color={hasText ? '#FFFFFF' : c.t4} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  )
}
