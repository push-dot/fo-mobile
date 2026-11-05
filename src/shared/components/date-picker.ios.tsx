import { DatePicker as SwiftDatePicker, HStack, Picker, Text as SText } from '@expo/ui/swift-ui'
import {
  accessibilityLabel as a11yLabel,
  datePickerStyle,
  fixedSize,
  labelsHidden,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers'
import { View } from 'react-native'
import { radius, spacing, useColors } from '../../theme'
import { clampMonth, yearsBetween } from '../utility'
import { MONTHS } from './constants'
import type { DatePickerProps } from './date-picker.android'
import Menu from './menu.ios'
import NativeHost from './native-host'
import Text from './text'

// SwiftUI has no month-only picker, so month mode is a year menu plus a month menu.
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
  const field = { minHeight: 48, borderRadius: radius.md, backgroundColor: c[surface], justifyContent: 'center', alignItems: 'flex-start' } as const
  if (!value) {
    const month = new Date().getMonth() + 1
    return (
      <View style={[field, { paddingHorizontal: spacing[4] }]}>
        <Menu
          accessibilityLabel={`${label} 연도`}
          actions={yearsBetween(min, max).map((y) => ({ key: String(y), label: `${y}년`, onPress: () => pick(y, month) }))}
        >
          <Text v="b1" color="t3">
            {label}
          </Text>
        </Menu>
      </View>
    )
  }
  return (
    <View style={[field, { paddingHorizontal: spacing[2] }]}>
      <NativeHost matchContents>
        <HStack spacing={0}>
          <Picker
            selection={value.getFullYear()}
            onSelectionChange={(y) => pick(y, value.getMonth() + 1)}
            modifiers={[pickerStyle('menu'), fixedSize(), a11yLabel(`${label} 연도`)]}
          >
            {yearsBetween(min, max).map((y) => (
              <SText key={y} modifiers={[tag(y)]}>{`${y}년`}</SText>
            ))}
          </Picker>
          <Picker
            selection={value.getMonth() + 1}
            onSelectionChange={(m) => pick(value.getFullYear(), m)}
            modifiers={[pickerStyle('menu'), fixedSize(), a11yLabel(`${label} 월`)]}
          >
            {MONTHS.map((m) => (
              <SText key={m} modifiers={[tag(m)]}>{`${m}월`}</SText>
            ))}
          </Picker>
        </HStack>
      </NativeHost>
    </View>
  )
}

export default DatePicker
