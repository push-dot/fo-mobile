import { useState, type Ref } from 'react'
import { ActivityIndicator, Pressable, TextInput, useWindowDimensions, View, type TextInputInstance } from 'react-native'
import { fontFor, onAccent, radius, spacing, type, useColors } from '../../../theme'
import { GlassField, Icon, Text, hitSlopTo } from '@/shared/components'
import { inputReset, iosLineBox } from '@/shared/components/text-field-metrics'
import { useXlBoardText } from '@/shared/components/xl-chrome'
import { displayName } from '@/shared/utility/display-name'
import { composerFontScale, emptyFieldHeight } from '../utils/composer-geometry'
import { COMPOSER_ROW, settleComposerLayout } from '../utils/composer-layout'
import { composerWeight } from '../utils/composer-weight'


/** The box stops growing at five lines and scrolls inside (ChatKeyboardIOS). */
export const COMPOSER_MAX_LINES = 5

const ROW_HEIGHT = 44
const PILL_PAD = 4
const PILL_HEIGHT = ROW_HEIGHT + PILL_PAD * 2
const DISC = 36

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
  attachment?: string
  onClearAttachment?: () => void
  inputRef?: Ref<TextInputInstance>
  tools?: boolean
  maxLength?: number
  label?: string
  sending?: boolean
  /** Credit-out state: the box is drawn at half opacity and takes no input. */
  disabled?: boolean
}

/** One glass pill: + 첨부, the text, @ 언급, send or stop. Once the text wraps it becomes a box with the buttons on their own row below. Shared by both platforms. */
export const Composer = ({ inputRef, ...p }: ComposerProps) => {
  const c = useColors()
  const xl = useXlBoardText()
  const { fontScale: system } = useWindowDimensions()
  const fontScale = composerFontScale(xl, system)
  const typed = p.value.trim()
  const hasText = typed.length > 0
  // A bare "@" only opens the suggestions; there is nothing to send yet.
  const canSend = hasText && typed !== '@' && !p.sending && !p.disabled
  const showTools = p.tools ?? true
  const round = { width: ROW_HEIGHT, height: ROW_HEIGHT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } as const
  const disc = { width: DISC, height: DISC, borderRadius: DISC / 2, alignItems: 'center', justifyContent: 'center' } as const
  const textType = type.h3
  const [layout, setLayout] = useState(COMPOSER_ROW)
  if (!p.value && layout.box) setLayout(COMPOSER_ROW)
  const box = layout.box
  const plus = showTools ? (
    <Pressable key="plus" accessibilityRole="button" accessibilityLabel="첨부" onPress={p.onAttach} hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)} style={round}>
      <View style={[disc, { backgroundColor: c.fill2 }]}>
        <Icon name="plus" size={20} />
      </View>
    </Pressable>
  ) : null
  const mention = showTools ? (
    <Pressable key="mention" accessibilityRole="button" accessibilityLabel="언급" onPress={p.onMention} hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)} style={round}>
      <View style={[disc, { backgroundColor: c.fill2 }]}>
        <Icon name="at" size={20} />
      </View>
    </Pressable>
  ) : null
  const field = (
    <View key="field" style={box ? { paddingHorizontal: spacing[3], paddingTop: spacing[2] } : { flex: 1, minHeight: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: showTools ? spacing[1] : spacing[3] }}>
      <View
        onLayout={(e) => {
          const lines = Math.max(1, Math.round(e.nativeEvent.layout.height / (textType.lineHeight * fontScale)))
          setLayout((l) => settleComposerLayout(l, lines, p.value.length))
        }}
      >
        {p.value ? null : (
          <Text v="h3" weight="400" color="t4" numberOfLines={1} allowFontScaling={!xl} pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            {p.placeholder}
          </Text>
        )}
        <TextInput
          ref={inputRef}
          value={p.value}
          onChangeText={p.onChangeText}
          multiline
          allowFontScaling={!xl}
          lineBreakStrategyIOS="hangul-word"
          editable={!p.disabled}
          accessibilityLabel={p.label ?? '메시지'}
          maxLength={p.maxLength}
          // iOS keeps a multiline field at its last height after the text is cleared.
          style={[{ fontSize: textType.fontSize, lineHeight: textType.lineHeight, letterSpacing: textType.letterSpacing, color: c.t1, maxHeight: COMPOSER_MAX_LINES * textType.lineHeight * fontScale, height: emptyFieldHeight(p.value, textType.lineHeight, fontScale), ...inputReset, ...iosLineBox(textType.lineHeight, textType.fontSize, fontScale) }, fontFor(composerWeight(p.value))]}
        />
      </View>
    </View>
  )
  const action =
    p.working && !hasText ? (
      <Pressable
        key="action"
        accessibilityRole="button"
        accessibilityLabel="중지"
        onPress={p.onStop}
        hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)}
        style={({ pressed }) => [round, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
      >
        <View style={[disc, { backgroundColor: c.t1 }]}>
          <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: c.bg }} />
        </View>
      </Pressable>
    ) : (
      <Pressable
        key="action"
        accessibilityRole="button"
        accessibilityLabel="보내기"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={p.onSend}
        hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)}
        style={round}
      >
        <View style={[disc, { backgroundColor: canSend || p.sending ? c.ac : c.fill2 }]}>
          {p.sending ? <ActivityIndicator color={onAccent} /> : <Icon name="up" size={18} color={canSend ? onAccent : 't4'} />}
        </View>
      </Pressable>
    )
  return (
    <View pointerEvents={p.disabled ? 'none' : 'auto'} style={{ gap: spacing[2] }}>
      {p.attachment ? (
        // MaterialsSendHere / BotPickSent (.ncomp > .achip): a 40pt white capsule (14 left, 10 right) with a 1px line ring and a soft drop shadow, no file icon, a 28pt round × on the right, 70% wide at most.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${displayName(p.attachment)} 첨부 빼기`}
          onPress={p.onClearAttachment ?? (() => undefined)}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing[2], height: 40, paddingLeft: 14, paddingRight: 10, borderRadius: radius.lg, backgroundColor: c.bg, boxShadow: `0 0 0 1px ${c.line}, 0 4px 14px rgba(0,0,0,.06)`, maxWidth: '70%' }}
        >
          <Text v="c1" weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
            {displayName(p.attachment)}
          </Text>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={14} color="t3" />
          </View>
        </Pressable>
      ) : null}
      <GlassField style={{ flexDirection: box ? 'column' : 'row', alignItems: box ? 'stretch' : 'flex-end', padding: PILL_PAD, borderRadius: PILL_HEIGHT / 2 }}>
        {box ? [field, <View key="bar" style={{ flexDirection: 'row', alignItems: 'center' }}>{plus}<View style={{ flex: 1 }} />{mention}{action}</View>] : [plus, field, mention, action]}
      </GlassField>
    </View>
  )
}
