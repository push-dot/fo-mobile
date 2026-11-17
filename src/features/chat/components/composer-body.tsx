import type { Ref } from 'react'
import { ActivityIndicator, Pressable, TextInput, useWindowDimensions, View, type TextInputInstance } from 'react-native'
import { fontFor, onAccent, radius, spacing, type, useColors } from '../../../theme'
import { GlassField, Icon, Text, hitSlopTo } from '@/shared/components'
import { inputReset, iosLineBox } from '@/shared/components/text-field-metrics'
import { useXlBoardText } from '@/shared/components/xl-chrome'
import { displayName } from '@/shared/utility/display-name'
import { emptyFieldHeight } from '../utils/composer-geometry'
import { composerWeight } from '../utils/composer-weight'


/** The box stops growing at five lines and scrolls inside (ChatKeyboardIOS). */
export const COMPOSER_MAX_LINES = 5

const ROW_HEIGHT = 44
const PILL_PAD = 4
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
  /** Height the text field has grown past its first line, so the thread can lift with it (ChatKeyboardIOS.2). */
  onGrow?: (extra: number) => void
}

/** One glass pill, one row inside it: + 첨부, the text, @ 언급, send or stop. It grows inside the pill as the text wraps. Shared by both platforms. */
export const Composer = ({ inputRef, ...p }: ComposerProps) => {
  const c = useColors()
  const xl = useXlBoardText()
  // ChatBotStatusXL, ChatBotHeaderXL: the board draws the box text at 17 pt whatever the system size, so the placeholder keeps its whole line.
  const { fontScale: system } = useWindowDimensions()
  const fontScale = xl ? 1 : system
  const typed = p.value.trim()
  const hasText = typed.length > 0
  // A bare "@" only opens the suggestions; there is nothing to send yet.
  const canSend = hasText && typed !== '@' && !p.sending && !p.disabled
  const showTools = p.tools ?? true
  const round = { width: ROW_HEIGHT, height: ROW_HEIGHT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } as const
  const disc = { width: DISC, height: DISC, borderRadius: DISC / 2, alignItems: 'center', justifyContent: 'center' } as const
  const textType = type.h3
  return (
    <View pointerEvents={p.disabled ? 'none' : 'auto'} style={{ gap: spacing[2] }}>
      {p.attachment ? (
        // MaterialsSendHere / BotPickSent (.achip): a white capsule with a 1px line ring, no file icon, 6pt padding, a 28pt round × on the right.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${displayName(p.attachment)} 첨부 빼기`}
          onPress={p.onClearAttachment ?? (() => undefined)}
          style={{ alignSelf: 'flex-start', marginLeft: spacing[1], flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: 6, borderRadius: 14, backgroundColor: c.bg, boxShadow: `0 0 0 1px ${c.line}`, maxWidth: 270 }}
        >
          <Text v="c1" weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
            {displayName(p.attachment)}
          </Text>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={14} color="t3" />
          </View>
        </Pressable>
      ) : null}
      <GlassField style={{ flexDirection: 'row', alignItems: 'flex-end', padding: PILL_PAD, borderRadius: (ROW_HEIGHT + PILL_PAD * 2) / 2 }}>
        {showTools ? (
          <Pressable accessibilityRole="button" accessibilityLabel="첨부" onPress={p.onAttach} hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)} style={round}>
            <View style={[disc, { backgroundColor: c.fill2 }]}>
              <Icon name="plus" size={18} />
            </View>
          </Pressable>
        ) : null}
        <View style={{ flex: 1, minHeight: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: showTools ? spacing[1] : spacing[3] }}>
          {/* ChatBotHeaderLong: a long placeholder is one line cut with an ellipsis; a multiline field would wrap it. */}
          <View
            onLayout={(e) => {
              const line = textType.lineHeight * fontScale
              p.onGrow?.((Math.max(1, Math.round(e.nativeEvent.layout.height / line)) - 1) * line)
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
              // iOS keeps a multiline field at the height of the last sent text; an empty field is one line again (ChatErrOther).
              // The board's typed line inherits the page's -0.02em ("@모아" 47.1 pt tracked, 48.1 without) and is 600 only while a mention is being typed.
              style={[{ fontSize: textType.fontSize, lineHeight: textType.lineHeight, letterSpacing: textType.letterSpacing, color: c.t1, maxHeight: COMPOSER_MAX_LINES * textType.lineHeight * fontScale, height: emptyFieldHeight(p.value, textType.lineHeight, fontScale), ...inputReset, ...iosLineBox(textType.lineHeight, textType.fontSize, fontScale) }, fontFor(composerWeight(p.value))]}
            />
          </View>
        </View>
        {showTools ? (
          <Pressable accessibilityRole="button" accessibilityLabel="언급" onPress={p.onMention} hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)} style={round}>
            <View style={[disc, { backgroundColor: c.fill2 }]}>
              <Icon name="at" size={18} />
            </View>
          </Pressable>
        ) : null}
        {p.working && !hasText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="중지"
            onPress={p.onStop}
            hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)}
            style={({ pressed }) => [round, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
          >
            <View style={[disc, { backgroundColor: c.t1 }]}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c.bg }} />
            </View>
          </Pressable>
        ) : (
          <Pressable
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
        )}
      </GlassField>
    </View>
  )
}
