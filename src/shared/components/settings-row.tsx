import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Icon from './icon'
import Text from './text'

type RowProps = {
  label: string
  sub?: string
  value?: string
  onPress?: () => void
  right?: ReactNode
  danger?: boolean
}

const SettingsRow = ({ label, sub, value, onPress, right, danger }: RowProps) => {
  const body = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <Text v="b1" color={danger ? 'red' : 't1'}>
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
              <Text v="b1" color="t3">
                {value}
              </Text>
            ) : null}
            <Icon name="chev" size={18} color="t4" />
          </View>
        ) : value ? (
          <Text v="b1" color="t3">
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
