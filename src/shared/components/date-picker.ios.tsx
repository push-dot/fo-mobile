import { DatePicker as SwiftDatePicker, HStack, Picker, Text } from '@expo/ui/swift-ui'
import { accessibilityLabel as a11yLabel, datePickerStyle, labelsHidden, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import { clampMonth, startOfMonth, yearsBetween } from '../utility'
import { MONTHS } from './constants'
import type { DatePickerProps } from './date-picker.android'
import NativeHost from './native-host'

/** iOS: compact SwiftUI DatePicker; month mode is a year menu plus a month menu (SwiftUI has no month-only picker). */
const DatePicker = ({ value, onChange, label, mode = 'date', min, max }: DatePickerProps) => {
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
  const shown = value ?? startOfMonth(new Date())
  const pick = (year: number, month: number) => onChange(clampMonth(new Date(year, month - 1, 1), min, max))
  return (
    <NativeHost matchContents>
      <HStack spacing={8}>
        <Picker
          selection={shown.getFullYear()}
          onSelectionChange={(y) => pick(y, shown.getMonth() + 1)}
          modifiers={[pickerStyle('menu'), a11yLabel(`${label} 연도`)]}
        >
          {yearsBetween(min, max).map((y) => (
            <Text key={y} modifiers={[tag(y)]}>{`${y}년`}</Text>
          ))}
        </Picker>
        <Picker
          selection={shown.getMonth() + 1}
          onSelectionChange={(m) => pick(shown.getFullYear(), m)}
          modifiers={[pickerStyle('menu'), a11yLabel(`${label} 월`)]}
        >
          {MONTHS.map((m) => (
            <Text key={m} modifiers={[tag(m)]}>{`${m}월`}</Text>
          ))}
        </Picker>
      </HStack>
    </NativeHost>
  )
}

export default DatePicker
