import { useMemo, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { GlassButton, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { useCalendarEvents } from '../api/hooks'
import { dayTitle, monthGrid, sameDay } from '../utils'

const DAY_SIZE = 30
// The iOS sheet pads its content 16; the board's month sits 8 from the sheet edge and pads the rows 12 itself.
const SHEET_INSET = Platform.OS === 'ios' ? spacing[2] : 0
const ROW_PAD = SHEET_INSET ? spacing[3] : 0
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

/** The board's MyCalendarModal body: a month with prev/next, one grey dot per day that has events. */
const MonthGrid = ({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) => {
  const c = useColors()
  const today = useMemo(() => new Date(), [])
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const cells = useMemo(() => monthGrid(month.getFullYear(), month.getMonth()), [month])
  const to = new Date(cells[cells.length - 1]!.getTime() + 86_400_000)
  const { data } = useCalendarEvents(cells[0]!.toISOString(), to.toISOString())
  const events = data?.data ?? []
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  return (
    <View style={{ marginHorizontal: -SHEET_INSET, gap: spacing[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingLeft: ROW_PAD, paddingRight: SHEET_INSET ? spacing[1] : 0 }}>
        <Text v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </Text>
        {/* The 44pt buttons overlap the row by 4 above and below, so the row is the board's 36 high. */}
        <View style={{ marginVertical: -spacing[1] }}>
          <GlassButton actions={[{ icon: 'back', label: '이전 달', onPress: () => shift(-1) }]} />
        </View>
        <View style={{ marginVertical: -spacing[1] }}>
          <GlassButton actions={[{ icon: 'chev', label: '다음 달', onPress: () => shift(1) }]} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: ROW_PAD }}>
        {WEEK.map((w) => (
          <Text key={w} v="c2" weight="700" color="t3" style={{ flex: 1, textAlign: 'center' }}>
            {w}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingTop: spacing[1], paddingBottom: SHEET_INSET, paddingHorizontal: ROW_PAD }}>
        {cells.map((d) => {
          const inMonth = d.getMonth() === month.getMonth()
          const isSel = sameDay(d, selected)
          const isToday = sameDay(d, today)
          const count = events.filter((e) => sameDay(new Date(e.startsAt), d)).length
          return (
            <Pressable
              key={d.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={`${dayTitle(d, today)}${count ? `, 일정 ${count}개` : ''}`}
              accessibilityState={{ selected: isSel }}
              onPress={() => onSelect(d)}
              style={{ width: `${100 / 7}%`, height: 42, alignItems: 'center', gap: spacing[1] }}
            >
              <View style={{ width: DAY_SIZE, height: DAY_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                {isSel ? <View style={{ position: 'absolute', inset: 0, borderRadius: DAY_SIZE / 2, backgroundColor: c.t1 }} /> : null}
                <Text v="b2" weight={isSel || isToday ? '800' : '600'} style={{ color: isSel ? c.bg : inMonth ? c.t1 : c.t4 }}>
                  {d.getDate()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing[1], height: 5 }}>
                {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                  <View key={i} style={{ width: 5, height: 5, borderRadius: radius.pill, backgroundColor: c.t4 }} />
                ))}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default MonthGrid
