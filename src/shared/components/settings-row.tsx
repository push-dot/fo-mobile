import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { spacing, type } from '../../theme'
import Icon from './icon'
import Text from './text'

type RowProps = {
  label: string
  sub?: string
  value?: string
  onPress?: () => void
  right?: ReactNode
  danger?: boolean
  /** Accent label (acText, 700). Used for 차단한 사람. */
  accent?: boolean
}

const SettingsRow = ({ label, sub, value, onPress, right, danger, accent }: RowProps) => {
  const body = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] }}>
      <View style={{ flex: 1 }}>
        <Text v="b1" color={danger ? 'red' : accent ? 'acText' : 't1'} weight={accent ? '700' : undefined} style={{ lineHeight: type.b2.lineHeight }}>
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
            <Icon name="chev" size={18} color="t4" />
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
