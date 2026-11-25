import { router } from 'expo-router'
import { MonthGrid, useCalendarDay } from '@/features/my'
import { Sheet } from '@/shared/components'
import { spacing } from '@/theme'

const CalendarSheetScreen = () => {
  const day = useCalendarDay((s) => s.day)
  return (
    <Sheet gap={spacing[3]}>
      <MonthGrid
        selected={day}
        onSelect={(d) => {
          useCalendarDay.setState({ day: d })
          router.back()
        }}
      />
    </Sheet>
  )
}

export default CalendarSheetScreen
