import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { spacing, type, useColors } from '../../theme'
import Icon from './icon'
import Text from './text'

type RowProps = {
  label: string
  sub?: string
  value?: string
  onPress?: () => void
  right?: ReactNode
  danger?: boolean
  /** The entry state (SettingsBlockedEntry): acSoft row with an acText, 700 label. */
  entry?: boolean
}

const SettingsRow = ({ label, sub, value, onPress, right, danger, entry }: RowProps) => {
  const c = useColors()
  const body = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2], ...(entry ? { backgroundColor: c.acSoft } : {}) }}>
      <View style={{ flex: 1 }}>
        <Text v="b1" color={danger ? 'red' : entry ? 'acText' : 't1'} weight={entry ? '700' : undefined} style={{ lineHeight: type.b2.lineHeight }}>
          {label}
        </Text>
        {sub ? (
          <Text v="c1" color="t3">
            {sub}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {value ? (
              <Text v="b2" color="t3">
                {value}
              </Text>
            ) : null}
            <Icon name="chev" size={16} color={value ? 't3' : 't1'} />
          </View>
        ) : value ? (
          <Text v="b2" color="t3">
            {value}
          </Text>
        ) : null)}
    </View>
  )
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  )
}

export default SettingsRow
