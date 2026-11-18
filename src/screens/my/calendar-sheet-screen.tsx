import { router } from 'expo-router'
import { MonthGrid, useCalendarDay } from '@/features/my'
import { Sheet } from '@/shared/components'
import { spacing } from '@/theme'

const CalendarSheetScreen = () => {
  const day = useCalendarDay((s) => s.day)
  return (
    // 12: the board's sheet is 12 below the top and draws the grabber with a 4 margin and an 8 gap before the header.
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
