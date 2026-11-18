import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { largeType, spacing, type } from '../../theme'
import Icon from './icon'
import Text from './text'

type RowProps = {
  label: string
  sub?: string
  value?: string
  onPress?: () => void
  right?: ReactNode
  danger?: boolean
  /** Draws the chevron on a row that does not open anything (the board shows it before there is a posting). */
  chevron?: boolean
  /** The row's value sits inside the board `.v` (커리어 상태, 연락처, 차단한 사람), so its chevron is t3; other rows keep the label colour (t1). */
  mutedChevron?: boolean
  /** A value row that opens a picker (v415 Settings): the label is the value itself; only the up-down selector sits on the right. */
  picker?: boolean
  /** BotProfileXL: the board's `.grp .it` is XL_ROW_HEIGHT high with 21 pt labels and 18 pt values, drawn in fixed pixels. */
  xl?: boolean
}

/** BotProfileXL `.grp .it`: the label is the b1 size on the b2 line, the value has no type token. Fixed pixels, so no system scaling. */
export const XL_ROW_LABEL = { fontSize: largeType.b1.fontSize, lineHeight: largeType.b2.lineHeight }
export const XL_ROW_VALUE = { fontSize: 18 }
export const XL_ROW_HEIGHT = 80

const SettingsRow = ({ label, sub, value, onPress, right, danger, chevron, mutedChevron, picker, xl }: RowProps) => {
  const labelSize = xl ? XL_ROW_LABEL : { lineHeight: type.b2.lineHeight }
  const valueSize = xl ? XL_ROW_VALUE : undefined
  const body = (
    <View
      style={{
        minHeight: xl ? XL_ROW_HEIGHT : 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingVertical: spacing[2],
      }}
    >
      <View style={{ flex: 1 }}>
        <Text v="b1" color={danger ? 'red' : 't1'} allowFontScaling={xl ? false : undefined} style={labelSize}>
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
              <Text v="b2" color="t3" allowFontScaling={xl ? false : undefined} style={valueSize}>
                {value}
              </Text>
            ) : null}
            <Icon name="chev" size={16} color={mutedChevron || value ? 't3' : 't1'} />
          </View>
        ) : value ? (
          <Text v="b2" color="t3" allowFontScaling={xl ? false : undefined} style={valueSize}>
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
