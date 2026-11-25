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
  chevron?: boolean
  mutedChevron?: boolean
  picker?: boolean
  xl?: boolean
}

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
