import { TextInput, View, type TextInputProps } from 'react-native'
import type { IconName } from '@push/design-system'
import { fontFor, radius, spacing, type, useColors } from '../../theme'
import Icon from './icon'
import Text from './text'

type Props = TextInputProps & { icon?: IconName; label?: string; max?: number; variant?: 'field' | 'search' }

const TextField = ({ icon, label, max, multiline, value, style, variant = 'field', ...rest }: Props) => {
  const c = useColors()
  const search = variant === 'search'
  return (
    <View
      style={{
        borderRadius: search ? radius.pill : radius.md,
        backgroundColor: c.fill,
        paddingHorizontal: spacing[4],
        paddingVertical: multiline || label ? spacing[4] : 0,
        minHeight: search ? 48 : 56,
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
        {(search ? 'search' : icon) ? <Icon name={search ? 'search' : icon!} size={search ? 20 : 18} color="t3" /> : null}
        <TextInput
          value={value}
          multiline={multiline}
          maxLength={max}
          placeholderTextColor={c.t4}
          style={[{ flex: 1, fontSize: type.b1.fontSize, lineHeight: type.b1.lineHeight, color: c.t1, minHeight: multiline ? 96 : 24, textAlignVertical: multiline ? 'top' : 'center' }, fontFor('400'), style]}
          {...rest}
        />
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
