import type { ReactNode } from 'react'
import { StyleSheet, TextInput, useWindowDimensions, View, type TextInputProps } from 'react-native'
import type { IconName } from '@push/design-system'
import { fontFor, radius, spacing, type, useColors } from '../../theme'
import Icon from './icon'
import { inputMetrics, iosLineBox } from './text-field-metrics'
import Text from './text'

const RING = 2

/** `compact`: the 48pt `.field` some boards draw (FilterSkill search) instead of the 56pt default. */
type Props = TextInputProps & { icon?: IconName; label?: string; max?: number; variant?: 'field' | 'search'; compact?: boolean; trailing?: ReactNode; focusRing?: boolean }

const TextField = ({ icon, label, max, multiline, value, style, variant = 'field', compact, trailing, focusRing, ...rest }: Props) => {
  const c = useColors()
  const { fontScale } = useWindowDimensions()
  const search = variant === 'search'
  return (
    <View
      style={{
        borderRadius: search ? radius.pill : radius.md,
        backgroundColor: c.fill,
        paddingHorizontal: spacing[4],
        paddingVertical: multiline || label ? spacing[4] : 0,
        minHeight: search || compact ? 48 : 56,
        justifyContent: 'center',
        gap: spacing[2],
      }}
    >
      {label ? (
        <Text v="c1" weight="700" color="t3">
          {label}
        </Text>
      ) : null}
      {focusRing ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.md, borderWidth: RING, borderColor: c.ac }]} /> : null}
      <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: spacing[2] }}>
        {(search ? 'search' : icon) ? <Icon name={search ? 'search' : icon!} size={search ? 20 : 18} color={search ? 't3' : 't1'} /> : null}
        <TextInput
          value={value}
          multiline={multiline}
          maxLength={max}
          placeholderTextColor={c.t4}
          style={[{ flex: 1, fontSize: type.b1.fontSize, letterSpacing: type.b1.letterSpacing, color: c.t1, ...inputMetrics(multiline, fontScale), textAlignVertical: multiline ? 'top' : 'center' }, fontFor('400'), multiline && iosLineBox(StyleSheet.flatten(style)?.lineHeight ?? type.b1.lineHeight, type.b1.fontSize, fontScale), style]}
          {...rest}
        />
        {trailing}
      </View>
      {max && multiline ? (
        <Text v="c2" color="t3" style={{ alignSelf: 'flex-end' }}>
          {(value ?? '').length} / {max}
        </Text>
      ) : null}
    </View>
  )
}

export default TextField
