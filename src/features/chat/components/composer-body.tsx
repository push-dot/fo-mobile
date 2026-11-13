import type { AccessMode } from '@push/api-client'
import type { Ref } from 'react'
import { ActivityIndicator, Pressable, TextInput, useWindowDimensions, View, type TextInputInstance } from 'react-native'
import { fontFor, onAccent, radius, spacing, type, useColors } from '../../../theme'
import { Icon, Text, hitSlopTo } from '@/shared/components'
import { inputReset, iosLineBox } from '@/shared/components/text-field-metrics'
import ModePicker from './mode-picker'


export type ComposerProps = {
  value: string
  onChangeText: (t: string) => void
  onSend: () => void
  placeholder: string
  /** Agent is working: the right side becomes a single black stop button. */
  working?: boolean
  onStop?: () => void
  onAttach?: () => void
  onMention?: () => void
  onMic?: () => void
  attachment?: string
  onClearAttachment?: () => void
  accessMode?: AccessMode
  inputRef?: Ref<TextInputInstance>
  /** First screen: the box is 4pt roomier (padding 16/12/12/20, gap 16) than inside a conversation. */
  roomy?: boolean
  layout?: 'stack' | 'inline'
  tools?: boolean
  maxLength?: number
  label?: string
  sending?: boolean
  /** Credit-out state: the box is drawn at half opacity and takes no input. */
  disabled?: boolean
}

/** Text line on top (17px), control row below: + 첨부 · @ 언급 … mic · send/stop. Shared by both platforms. */
export const ComposerBody = ({ inputRef, roomy, ...p }: ComposerProps) => {
  const c = useColors()
  const { fontScale } = useWindowDimensions()
  const typed = p.value.trim()
  const hasText = typed.length > 0
  // A bare "@" only opens the suggestions; there is nothing to send yet.
  const canSend = hasText && typed !== '@' && !p.sending && !p.disabled
  const inline = p.layout === 'inline'
  const showTools = !inline && (p.tools ?? true)
  const round = { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } as const
  const chip = { minHeight: 40, paddingHorizontal: spacing[4], borderRadius: radius.pill, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', gap: spacing[2] } as const
  const textType = inline ? type.b1 : type.h3
  if (inline) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 52, padding: 6 }}>
        <TextInput
          ref={inputRef}
          value={p.value}
          onChangeText={p.onChangeText}
          placeholder={p.placeholder}
          placeholderTextColor={c.t4}
          multiline
          maxLength={p.maxLength}
          accessibilityLabel={p.label ?? '메시지'}
          style={[{ flex: 1, fontSize: textType.fontSize, lineHeight: textType.lineHeight, color: c.t1, maxHeight: 120, ...inputReset, paddingHorizontal: spacing[1], paddingVertical: spacing[2], minHeight: 40, textAlignVertical: 'center' }, fontFor(hasText ? '600' : '400')]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="보내기"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={p.onSend}
          hitSlop={hitSlopTo(40, 40)}
          style={[round, { backgroundColor: canSend ? c.ac : c.fill2 }]}
        >
          {p.sending ? <ActivityIndicator color={c.t3} /> : <Icon name="up" size={20} color={canSend ? onAccent : c.t4} />}
        </Pressable>
      </View>
    )
  }
  return (
    <View pointerEvents={p.disabled ? 'none' : 'auto'} style={{ opacity: p.disabled ? 0.5 : 1, paddingTop: spacing[4], paddingRight: roomy ? spacing[3] : 10, paddingBottom: roomy ? spacing[3] : 10, paddingLeft: roomy ? spacing[5] : 18, gap: roomy ? spacing[4] : 14 }}>
      {p.attachment ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.attachment} 첨부 빼기`}
          onPress={p.onClearAttachment ?? (() => undefined)}
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
        editable={!p.disabled}
        accessibilityLabel={p.label ?? '메시지'}
        maxLength={p.maxLength}
        style={[{ fontSize: textType.fontSize, lineHeight: textType.lineHeight, color: c.t1, maxHeight: 140, ...inputReset, ...iosLineBox(textType.lineHeight, textType.fontSize, fontScale) }, fontFor(hasText ? '600' : '400')]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        {showTools ? (
          <>
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
            {p.accessMode ? <ModePicker value={p.accessMode} style={chip} /> : null}
          </>
        ) : null}
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
              {p.sending ? <ActivityIndicator color={c.t3} /> : <Icon name="up" size={20} color={canSend ? onAccent : c.t4} />}
            </Pressable>
          </>
        )}
      </View>
    </View>
  )
}
