import type { ReactNode } from 'react'
import { Platform, StyleSheet, TextInput, useWindowDimensions, View, type TextInputProps } from 'react-native'
import type { IconName } from '@push/design-system'
import { fontFor, iosSystemFill, radius, spacing, type, useColors, useThemeMode } from '../../theme'
import GlassField from './glass-field'
import Icon from './icon'
import { inputMetrics, inputResponder, iosLineBox } from './text-field-metrics'
import Text from './text'

/** `compact`: the 48pt `.field` some boards draw instead of the 56pt default. `slim`: the iOS filter sheet's 40pt `.isearch` (17pt text, 12pt side padding). */
type Props = TextInputProps & { icon?: IconName; label?: string; max?: number; variant?: 'field' | 'search'; compact?: boolean; slim?: boolean; trailing?: ReactNode; minHeight?: number }

const TextField = ({ icon, label, max, multiline, value, style, variant = 'field', compact, slim, trailing, minHeight, ...rest }: Props) => {
  const c = useColors()
  const { fontScale } = useWindowDimensions()
  const search = variant === 'search'
  const dark = useThemeMode() === 'dark'
  // Rule 27 (note 264): a search or filter input is the iOS glass input.
  const glass = Platform.OS === 'ios' && (search || icon === 'search')
  const Surface = glass ? GlassField : View
  return (
    <Surface
      style={{
        borderRadius: search || slim ? radius.pill : radius.md,
        backgroundColor: glass ? undefined : slim ? iosSystemFill[dark ? 'dark' : 'light'] : c.fill,
        paddingHorizontal: slim ? spacing[3] : spacing[4],
        paddingVertical: multiline || label ? spacing[4] : 0,
        minHeight: minHeight ?? (slim ? 40 : search || compact ? 48 : 56),
        justifyContent: 'center',
        gap: spacing[2],
      }}
    >
      {label ? (
        <Text v="c1" weight="700" color="t3">
          {label}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: spacing[2] }}>
        {(search ? 'search' : icon) ? <Icon name={search ? 'search' : icon!} size={slim ? 17 : search ? 20 : 18} color={search || slim ? 't3' : 't1'} /> : null}
        <TextInput
          value={value}
          multiline={multiline}
          lineBreakStrategyIOS="hangul-word"
          maxLength={max}
          placeholderTextColor={c.t4}
          style={[{ flex: 1, fontSize: slim ? type.h3.fontSize : type.b1.fontSize, letterSpacing: slim ? type.b1.letterSpacing * (type.h3.fontSize / type.b1.fontSize) : type.b1.letterSpacing, color: c.t1, ...inputMetrics(multiline, fontScale), textAlignVertical: multiline ? 'top' : 'center' }, fontFor('400'), multiline && iosLineBox(StyleSheet.flatten(style)?.lineHeight ?? type.b1.lineHeight, type.b1.fontSize, fontScale), style]}
          {...inputResponder}
          {...rest}
        />
        {trailing}
      </View>
      {max && multiline ? (
        <Text v="c2" color="t3" style={{ alignSelf: 'flex-end' }}>
          {(value ?? '').length} / {max}
        </Text>
      ) : null}
    </Surface>
  )
}

export default TextField
