import { DatePicker as SwiftDatePicker } from '@expo/ui/swift-ui'
import { accessibilityLabel as a11yLabel, datePickerStyle, labelsHidden } from '@expo/ui/swift-ui/modifiers'
import { View } from 'react-native'
import { radius, spacing, useColors } from '../../theme'
import { clampMonth, yearsBetween } from '../utility'
import { MONTHS } from './constants'
import type { DatePickerProps } from './date-picker.android'
import Menu from './menu.ios'
import NativeHost from './native-host'
import Text from './text'

// SwiftUI has no month-only picker, so month mode is a year UIMenu plus a month UIMenu on the field's text.
const DatePicker = ({
  value,
  onChange,
  label,
  mode = 'date',
  min,
  max,
  surface = 'fill',
}: DatePickerProps) => {
  const c = useColors()
  if (mode !== 'month')
    return (
      <NativeHost matchContents>
        <SwiftDatePicker
          selection={value ?? undefined}
          displayedComponents={[mode === 'time' ? 'hourAndMinute' : 'date']}
          range={{ start: min, end: max }}
          onDateChange={onChange}
          modifiers={[datePickerStyle('compact'), labelsHidden(), a11yLabel(label)]}
        />
      </NativeHost>
    )
  const pick = (year: number, month: number) =>
    onChange(clampMonth(new Date(year, month - 1, 1), min, max))
  const field = { minHeight: 48, borderRadius: radius.md, backgroundColor: c[surface], paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[1] } as const
  const year = value?.getFullYear()
  const month = value ? value.getMonth() + 1 : new Date().getMonth() + 1
  return (
    <View style={field}>
      <Menu
        accessibilityLabel={`${label} 연도`}
        actions={yearsBetween(min, max).map((y) => ({ key: String(y), label: `${y}년`, selected: y === year, onPress: () => pick(y, month) }))}
      >
        <Text v="b1" color={value ? 't1' : 't3'}>
          {value ? `${year}년` : label}
        </Text>
      </Menu>
      {value ? (
        <Menu
          accessibilityLabel={`${label} 월`}
          actions={MONTHS.map((m) => ({ key: String(m), label: `${m}월`, selected: m === month, onPress: () => pick(value.getFullYear(), m) }))}
        >
          <Text v="b1">{`${month}월`}</Text>
        </Menu>
      ) : null}
    </View>
  )
}

export default DatePicker
