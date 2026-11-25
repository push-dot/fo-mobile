import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { GlassButton, Text } from '@/shared/components'
import { spacing } from '../../../theme'
import { useCalendarEvents } from '../api/hooks'
import { dayTitle, monthGrid, sameDay } from '../utils'

const DAY_SIZE = 30
const SHEET_INSET = Platform.OS === 'ios' ? spacing[2] : 0
const ROW_PAD = SHEET_INSET ? spacing[3] : 0
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

const MonthGrid = ({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) => {
  const today = new Date()
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const cells = monthGrid(month.getFullYear(), month.getMonth())
  const to = new Date(cells[cells.length - 1]!.getTime() + 86_400_000)
  const { data } = useCalendarEvents(cells[0]!.toISOString(), to.toISOString())
  const events = data?.data ?? []
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  return (
    <View style={styles.grid}>
      <View style={styles.head}>
        <Text v="h2" accessibilityRole="header" style={styles.month}>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </Text>
        <View style={styles.nav}>
          <GlassButton filled actions={[{ icon: 'back', label: '이전 달', onPress: () => shift(-1) }]} />
        </View>
        <View style={styles.nav}>
          <GlassButton filled actions={[{ icon: 'chev', label: '다음 달', onPress: () => shift(1) }]} />
        </View>
      </View>
      <View style={styles.week}>
        {WEEK.map((w) => (
          <Text key={w} v="c2" weight="700" color="t3" style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.cells}>
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
              style={styles.cell}
            >
              <View style={styles.day}>
                {isSel ? <View style={styles.selected} /> : null}
                <Text v="b2" weight={isSel || isToday ? '800' : '600'} style={[styles.date, !inMonth && styles.dateOut, isSel && styles.dateSelected]}>
                  {d.getDate()}
                </Text>
              </View>
              <View style={styles.dots}>
                {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                  <View key={i} style={styles.dot} />
                ))}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  grid: { marginHorizontal: -SHEET_INSET, gap: theme.spacing[2] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1], paddingLeft: ROW_PAD, paddingRight: SHEET_INSET ? theme.spacing[1] : 0 },
  month: { flex: 1 },
  nav: { marginVertical: -theme.spacing[1] },
  week: { flexDirection: 'row', paddingHorizontal: ROW_PAD },
  weekday: { flex: 1, textAlign: 'center' },
  cells: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: theme.spacing[1], paddingBottom: SHEET_INSET, paddingHorizontal: ROW_PAD },
  cell: { width: `${100 / 7}%`, height: 42, alignItems: 'center', gap: theme.spacing[1] },
  day: { width: DAY_SIZE, height: DAY_SIZE, alignItems: 'center', justifyContent: 'center' },
  selected: { position: 'absolute', inset: 0, borderRadius: DAY_SIZE / 2, backgroundColor: theme.colors.t1 },
  date: { fontSize: 14, color: theme.colors.t1 },
  dateOut: { color: theme.colors.t4 },
  dateSelected: { color: theme.colors.bg },
  dots: { flexDirection: 'row', gap: theme.spacing[1], height: 5 },
  dot: { width: 5, height: 5, borderRadius: theme.radius.pill, backgroundColor: theme.colors.t2 },
}))

export default MonthGrid
