import { DatePickerDialog, TimePickerDialog } from '@expo/ui/jetpack-compose'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { radius, useColors } from '../../theme'
import { formatDay, formatMonth, formatTime, fromPickerUtc, startOfMonth, toPickerUtc, withTime } from '../utility'
import Icon from './icon'
import NativeHost from './native-host'
import Text from './text'

export type DatePickerProps = {
  value: Date | null
  onChange: (date: Date) => void
  /** Accessibility label; also the placeholder on Android while value is null. */
  label: string
  mode?: 'date' | 'time' | 'month'
  min?: Date
  max?: Date
}

const FORMAT = { date: formatDay, time: formatTime, month: formatMonth }

/** Android: a field that opens the Material 3 date or time dialog. Month mode keeps year and month of the picked day. */
const DatePicker = ({ value, onChange, label, mode = 'date', min, max }: DatePickerProps) => {
  const c = useColors()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={{ minHeight: 56, borderRadius: radius.md, backgroundColor: c.fill, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Text v="b1" color={value ? 't1' : 't4'} style={{ flex: 1 }}>
          {value ? FORMAT[mode](value) : label}
        </Text>
        <Icon name={mode === 'time' ? 'clock' : 'down'} size={18} color="t3" />
      </Pressable>
      {open ? (
        <NativeHost matchContents>
          {mode === 'time' ? (
            <TimePickerDialog
              initialDate={value?.toISOString()}
              is24Hour={false}
              color={c.ac}
              onDateSelected={(d) => (close(), onChange(withTime(value ?? d, d)))}
              onDismissRequest={close}
            />
          ) : (
            <DatePickerDialog
              initialDate={value ? toPickerUtc(value) : null}
              selectableDates={{ start: min, end: max }}
              color={c.ac}
              onDateSelected={(d) => {
                close()
                const day = fromPickerUtc(d)
                onChange(mode === 'month' ? startOfMonth(day) : day)
              }}
              onDismissRequest={close}
            />
          )}
        </NativeHost>
      ) : null}
    </>
  )
}

export default DatePicker
