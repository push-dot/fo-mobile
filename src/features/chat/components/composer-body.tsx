import { useEffect, useRef, useState, type Ref } from 'react'
import { ActivityIndicator, Platform, Pressable, TextInput, useWindowDimensions, View, type TextInputInstance } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { fontFor, onAccent, type } from '../../../theme'
import { Glass, GlassField, Icon, Text, hitSlopTo } from '@/shared/components'
import { inputReset, iosLineBox } from '@/shared/components/text-field-metrics'
import { useXlBoardText } from '@/shared/components/xl-chrome'
import { displayName } from '@/shared/utility/display-name'
import { composerFontScale, emptyFieldHeight } from '../utils/composer-geometry'
import { COMPOSER_ROW, settleComposerLayout } from '../utils/composer-layout'
import { composerWeight } from '../utils/composer-weight'


const COMPOSER_MAX_LINES = 5

const ROW_HEIGHT = 44
const PILL_PAD = 4
const PILL_HEIGHT = ROW_HEIGHT + PILL_PAD * 2
const DISC = 36

type ComposerProps = {
  value: string
  onChangeText: (t: string) => void
  onSend: () => void
  placeholder: string
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
  disabled?: boolean
}

const Composer = ({ inputRef, ...p }: ComposerProps) => {
  const xl = useXlBoardText()
  const { fontScale: system } = useWindowDimensions()
  const fontScale = composerFontScale(xl, system)
  const typed = p.value.trim()
  const hasText = typed.length > 0
  const canSend = hasText && typed !== '@' && !p.sending && !p.disabled
  const showTools = p.tools ?? true
  const textType = type.h3
  const [layout, setLayout] = useState(COMPOSER_ROW)
  if (!p.value && layout.box) setLayout(COMPOSER_ROW)
  const lines = useRef(1)
  useEffect(() => setLayout((l) => settleComposerLayout(l, lines.current, p.value.length)), [p.value.length])
  const box = layout.box
  const tool = (icon: 'plus' | 'at') =>
    Platform.OS === 'ios' ? (
      <Glass interactive style={styles.disc}>
        <Icon name={icon} size={20} />
      </Glass>
    ) : (
      <View style={[styles.disc, styles.discFill]}>
        <Icon name={icon} size={20} />
      </View>
    )
  const plus = showTools ? (
    <Pressable key="plus" accessibilityRole="button" accessibilityLabel="첨부" onPress={p.onAttach} hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)} style={styles.round}>
      {tool('plus')}
    </Pressable>
  ) : null
  const mention = showTools ? (
    <Pressable key="mention" accessibilityRole="button" accessibilityLabel="언급" onPress={p.onMention} hitSlop={hitSlopTo(ROW_HEIGHT, ROW_HEIGHT)} style={styles.round}>
      {tool('at')}
    </Pressable>
  ) : null
  const field = (
    <View key="field" style={box ? styles.fieldBox : [styles.fieldRow, showTools && styles.fieldRowTools]}>
      <View
        onLayout={(e) => {
          lines.current = Math.max(1, Math.round(e.nativeEvent.layout.height / (textType.lineHeight * fontScale)))
          setLayout((l) => settleComposerLayout(l, lines.current, p.value.length))
        }}
      >
        {p.value ? null : (
          <Text v="h3" weight="400" color="t4" numberOfLines={1} allowFontScaling={!xl} pointerEvents="none" style={styles.placeholder}>
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
          style={[styles.input(fontScale, emptyFieldHeight(p.value, textType.lineHeight, fontScale)), fontFor(composerWeight(p.value))]}
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
        style={({ pressed }) => [styles.round, pressed && styles.pressed]}
      >
        <View style={[styles.disc, styles.discStop]}>
          <View style={styles.stop} />
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
        style={styles.round}
      >
        <View style={[styles.disc, canSend || p.sending ? styles.discOn : styles.discFill]}>
          {p.sending ? <ActivityIndicator color={onAccent} /> : <Icon name="up" size={18} color={canSend ? onAccent : 't4'} />}
        </View>
      </Pressable>
    )
  return (
    <View pointerEvents={p.disabled ? 'none' : 'auto'} style={styles.body}>
      {p.attachment ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${displayName(p.attachment)} 첨부 빼기`}
          onPress={p.onClearAttachment ?? (() => undefined)}
          style={styles.attachment}
        >
          <Text v="c1" weight="600" numberOfLines={1} style={styles.attachmentName}>
            {displayName(p.attachment)}
          </Text>
          <View style={styles.attachmentClear}>
            <Icon name="x" size={14} color="t3" />
          </View>
        </Pressable>
      ) : null}
      <View style={[styles.pill, box && styles.pillBox]}>
        <GlassField style={[StyleSheet.absoluteFill, styles.pillFill]}>{null}</GlassField>
        {box ? [field, <View key="bar" style={styles.bar}>{plus}<View style={styles.spacer} />{mention}{action}</View>] : [plus, field, mention, action]}
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  round: { width: ROW_HEIGHT, height: ROW_HEIGHT, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.92 }] },
  disc: { width: DISC, height: DISC, borderRadius: DISC / 2, alignItems: 'center', justifyContent: 'center' },
  discFill: { backgroundColor: theme.colors.fill2 },
  discStop: { backgroundColor: theme.colors.t1 },
  discOn: { backgroundColor: theme.colors.ac },
  stop: { width: 11, height: 11, borderRadius: 3, backgroundColor: theme.colors.bg },
  fieldBox: { paddingHorizontal: theme.spacing[3], paddingTop: theme.spacing[2] },
  fieldRow: { flex: 1, minHeight: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: theme.spacing[3] },
  fieldRowTools: { paddingHorizontal: theme.spacing[1] },
  placeholder: { position: 'absolute', top: 0, left: 0, right: 0 },
  input: (fontScale: number, height: number | undefined) => ({
    fontSize: theme.type.h3.fontSize,
    lineHeight: theme.type.h3.lineHeight,
    letterSpacing: theme.type.h3.letterSpacing,
    color: theme.colors.t1,
    maxHeight: COMPOSER_MAX_LINES * theme.type.h3.lineHeight * fontScale,
    height,
    ...inputReset,
    ...iosLineBox(theme.type.h3.lineHeight, theme.type.h3.fontSize, fontScale),
  }),
  body: { gap: theme.spacing[2] },
  attachment: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    height: 40,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg,
    boxShadow: `0 0 0 1px ${theme.colors.line}, 0 4px 14px rgba(0,0,0,.06)`,
    maxWidth: '70%',
  },
  attachmentName: { flexShrink: 1 },
  attachmentClear: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'flex-end', padding: PILL_PAD, borderRadius: PILL_HEIGHT / 2 },
  pillBox: { flexDirection: 'column', alignItems: 'stretch' },
  pillFill: { borderRadius: PILL_HEIGHT / 2 },
  bar: { flexDirection: 'row', alignItems: 'center' },
  spacer: { flex: 1 },
}))

export type { ComposerProps }

export default Composer
