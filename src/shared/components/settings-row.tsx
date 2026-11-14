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
  /** The entry state (SettingsBlockedEntry): acSoft row with a t1, 700 label (owner rule 3: the accent is the fill only). */
  entry?: boolean
  /** Draws the chevron on a row that does not open anything (the board shows it before there is a posting). */
  chevron?: boolean
  /** The row's value sits inside the board `.v` (커리어 상태, 연락처, 차단한 사람), so its chevron is t3; other rows keep the label colour (t1). */
  mutedChevron?: boolean
  /** A value row that opens a picker (v415 Settings): the label is the value itself; only the up-down selector sits on the right. */
  picker?: boolean
}

const SettingsRow = ({ label, sub, value, onPress, right, danger, entry, chevron, mutedChevron, picker }: RowProps) => {
  const c = useColors()
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
        <Text v="b1" color={danger ? 'red' : 't1'} weight={entry ? '700' : undefined} style={{ lineHeight: type.b2.lineHeight }}>
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
            <Icon name="chev" size={16} color={mutedChevron || value ? 't3' : 't1'} />
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
