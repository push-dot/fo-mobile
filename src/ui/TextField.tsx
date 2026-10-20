import { TextInput, View, type TextInputProps } from 'react-native'
import { fontFor, radius, useColors } from '../theme'
import { Icon } from './Icon'
import type { IconName } from './icon-data'
import { Text } from './Text'

type Props = TextInputProps & { icon?: IconName; label?: string; max?: number }

/** Filled input: fill bg, radius-md, 56px, 16px text (never smaller). Multi-line adds label + counter. */
// React 19: `ref` arrives as a regular prop via TextInputProps.
export function TextField({ icon, label, max, multiline, value, style, ...rest }: Props) {
  const c = useColors()
  return (
    <View style={{ borderRadius: radius.md, backgroundColor: c.fill, paddingHorizontal: 16, paddingVertical: multiline ? 14 : 0, minHeight: 56, justifyContent: 'center' }}>
      {label ? (
        <Text v="c1" weight="700" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: 8 }}>
        {icon ? <Icon name={icon} size={18} color="t3" /> : null}
        <TextInput
          value={value}
          multiline={multiline}
          maxLength={max}
          placeholderTextColor={c.t4}
          style={[{ flex: 1, fontSize: 16, color: c.t1, minHeight: multiline ? 96 : 24, textAlignVertical: multiline ? 'top' : 'center' }, fontFor('400'), style]}
          {...rest}
        />
      </View>
      {max && multiline ? (
        <Text v="c2" color="t3" style={{ alignSelf: 'flex-end', marginTop: 6 }}>
          {(value ?? '').length} / {max}
        </Text>
      ) : null}
    </View>
  )
}
