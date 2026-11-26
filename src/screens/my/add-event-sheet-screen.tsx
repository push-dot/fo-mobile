import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import { EVENT_TYPES, fromDayParam, useAddCalendarEvent, type CalendarEventType } from '@/features/my'
import { Chip, DatePicker, Sheet, Text, TextField } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '@/theme'
import { withTime } from '@/shared/utility'

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const atNine = (day: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0)

const AddEventSheetScreen = () => {
  const dayParam = param(useLocalSearchParams<{ day?: string }>().day)
  const day = dayParam ? fromDayParam(dayParam) : null
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CalendarEventType>('INTERVIEW')
  const [date, setDate] = useState<Date | null>(day)
  const [time, setTime] = useState<Date | null>(day ? atNine(day) : null)
  const add = useAddCalendarEvent(() => router.back())

  const missing = !day
  useEffect(() => {
    if (missing) router.back()
  }, [missing])

  if (!day || !date || !time) return null

  return (
    <Sheet
      title="어떤 일정을 추가할까요?"
      gap={Platform.OS === 'ios' ? spacing[4] : undefined}
      action={{
        label: '일정 추가하기',
        disabled: !title.trim() || add.isPending,
        onPress: () => add.mutate({ type, title: title.trim(), startsAt: withTime(date, time).toISOString() }),
      }}
    >
      <View style={styles.dates}>
        <View style={styles.dateCell}>
          <DatePicker label="날짜" mode="date" value={date} onChange={setDate} minHeight={52} />
        </View>
        <View style={styles.dateCell}>
          <DatePicker label="시간" mode="time" value={time} onChange={setTime} minHeight={52} />
        </View>
      </View>
      <TextField accessibilityLabel="일정 이름" value={title} onChangeText={setTitle} placeholder="일정 이름" />
      <View style={styles.types}>
        {EVENT_TYPES.map((t) => (
          <Chip key={t.key} label={t.label} on={type === t.key} onPress={() => setType(t.key)} />
        ))}
      </View>
      {add.isError ? (
        <Text v="c1" color="red">
          일정을 추가하지 못했어요. 잠시 후 다시 해 주세요.
        </Text>
      ) : null}
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  dates: { flexDirection: 'row', gap: Platform.OS === 'ios' ? theme.spacing[3] : theme.spacing[2] },
  dateCell: { flex: Platform.OS === 'ios' ? undefined : 1 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
}))

export default AddEventSheetScreen
