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
  /** Accent label (acText, 700) without the row tint. Used for 차단한 사람. */
  accent?: boolean
  /** Draws the chevron on a row that does not open anything (the board shows it before there is a posting). */
  chevron?: boolean
  /** A value row that opens a picker (v415 Settings): the label is the value itself; only the up-down selector sits on the right. */
  picker?: boolean
}

const SettingsRow = ({ label, sub, value, onPress, right, danger, entry, accent, chevron, picker }: RowProps) => {
  const c = useColors()
  const accented = entry || accent
  const body = (
    <View
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingVertical: spacing[2],
        ...(entry ? { backgroundColor: c.acSoft } : {}),
      }}
    >
      <View style={{ flex: 1 }}>
        <Text v="b1" color={danger ? 'red' : accented ? 'acText' : 't1'} weight={accented ? '700' : undefined} style={{ lineHeight: type.b2.lineHeight }}>
          {label}
        </Text>
        {sub ? (
          <Text v="c1" color="t3">
            {sub}
          </Text>
        ) : null}
      </View>
      {right ??
        (picker ? (
          <Icon name="updown" size={14} color="t3" />
        ) : onPress || chevron ? (
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
