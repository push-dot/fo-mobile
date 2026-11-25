import type { ReactNode } from 'react'
import { Platform, TextInput, useWindowDimensions, View, type TextInputProps } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { IconName } from '@push/design-system'
import { fontFor, iosSystemFill, type, useColors } from '../../theme'
import GlassField from './glass-field'
import Icon from './icon'
import { inputMetrics, iosLineBox } from './text-field-metrics'
import Text from './text'

type Props = TextInputProps & { icon?: IconName; label?: string; max?: number; variant?: 'field' | 'search'; compact?: boolean; slim?: boolean; trailing?: ReactNode; minHeight?: number }

const TextField = ({ icon, label, max, multiline, value, style, variant = 'field', compact, slim, trailing, minHeight, ...rest }: Props) => {
  const c = useColors()
  const { fontScale } = useWindowDimensions()
  const search = variant === 'search'
  const glass = Platform.OS === 'ios' && (search || icon === 'search')
  const Surface = glass ? GlassField : View
  return (
    <Surface
      style={styles.surface(search || !!slim, !!slim, glass, !!(multiline || label), minHeight ?? (slim ? 40 : search || compact ? 48 : 56))}
    >
      {label ? (
        <Text v="c1" weight="700" color="t3">
          {label}
        </Text>
      ) : null}
      <View style={[styles.row, multiline && styles.rowTop]}>
        {(search ? 'search' : icon) ? <Icon name={search ? 'search' : icon!} size={slim ? 17 : search ? 20 : 18} color={search || slim ? 't3' : 't1'} /> : null}
        <TextInput
          value={value}
          multiline={multiline}
          lineBreakStrategyIOS="hangul-word"
          maxLength={max}
          placeholderTextColor={c.t4}
          style={[{ flex: 1, fontSize: slim ? type.h3.fontSize : type.b1.fontSize, letterSpacing: slim ? type.b1.letterSpacing * (type.h3.fontSize / type.b1.fontSize) : type.b1.letterSpacing, color: c.t1, ...inputMetrics(multiline, fontScale), textAlignVertical: multiline ? 'top' : 'center' }, fontFor('400'), multiline && iosLineBox(StyleSheet.flatten(style)?.lineHeight ?? type.b1.lineHeight, type.b1.fontSize, fontScale), style]}
          {...rest}
        />
        {trailing}
      </View>
      {max && multiline ? (
        <Text v="c2" color="t3" style={styles.counter}>
          {(value ?? '').length} / {max}
        </Text>
      ) : null}
    </Surface>
  )
}

const styles = StyleSheet.create((theme) => ({
  surface: (pill: boolean, slim: boolean, glass: boolean, padded: boolean, minHeight: number) => ({
    borderRadius: pill ? theme.radius.pill : theme.radius.md,
    backgroundColor: glass ? undefined : slim ? iosSystemFill[theme.mode] : theme.colors.fill,
    paddingHorizontal: slim ? theme.spacing[3] : theme.spacing[4],
    paddingVertical: padded ? theme.spacing[4] : 0,
    minHeight,
    justifyContent: 'center',
    gap: theme.spacing[2],
  }),
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  rowTop: { alignItems: 'flex-start' },
  counter: { alignSelf: 'flex-end' },
}))

export default TextField
