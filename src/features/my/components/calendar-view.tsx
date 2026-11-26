import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { monthDay } from '@push/shared'
import { router } from 'expo-router'
import { Icon, Text } from '@/shared/components'
import { useCalendarEvents, useGoogleConnected } from '../api/hooks'
import { EVENT_TYPES } from '../constants'
import { useCalendarDay } from '../stores'
import type { CalendarEvent } from '../types'
import { clock, dayTitle, dday, toDayParam } from '../utils'

const typeLabel = (k: CalendarEvent['type']) => EVENT_TYPES.find((t) => t.key === k)?.label ?? ''

const subline = (e: CalendarEvent) => {
  const mins = e.endsAt ? Math.round((Date.parse(e.endsAt) - Date.parse(e.startsAt)) / 60_000) : 0
  const dur = mins >= 60 ? `${mins / 60}시간` : mins > 0 ? `${mins}분` : ''
  return [e.notes, dur].filter(Boolean).join(' · ')
}

const CalendarView = () => {
  const today = new Date()
  const selected = useCalendarDay((s) => s.day)
  const from = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate())
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1)
  const { data } = useCalendarEvents(from.toISOString(), to.toISOString())
  const { data: googleConnected } = useGoogleConnected()
  const dayEvents = [...(data?.data ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return (
    <View>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${dayTitle(selected, today)}, 달력 열기`}
          onPress={() => router.push('/activity/calendar')}
          style={styles.dayButton}
        >
          <Text v="h2" accessibilityRole="header" numberOfLines={1} style={styles.dayTitle}>
            {dayTitle(selected, today)}
          </Text>
          <Icon name="down" size={20} color="t1" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="일정 추가"
          onPress={() => router.push({ pathname: '/activity/add-event', params: { day: toDayParam(selected) } })}
          style={styles.add}
        >
          <Text v="h3" weight="700" color="ac">
            추가
          </Text>
        </Pressable>
      </View>
      {googleConnected === undefined ? null : (
        <Text v="c1" color="t3" style={styles.google}>
          {googleConnected ? 'Google 캘린더 연결됨' : 'Google 연결 안 됨'}
        </Text>
      )}
      {!data ? null : dayEvents.length === 0 ? (
        <Text v="b2" color="t3" style={styles.empty}>
          이날은 일정이 없어요.
        </Text>
      ) : (
        dayEvents.map((e) => {
          const deadline = e.type === 'DEADLINE'
          return (
            <View key={e.id} style={styles.event}>
              <View style={styles.eventBar} />
              <View style={styles.eventBody}>
                <Text v="c2" weight="700" color="t3">
                  {deadline ? `마감 · ${monthDay(e.startsAt)}` : typeLabel(e.type)}
                </Text>
                <Text v="b1" weight="700" numberOfLines={1}>
                  {e.title}
                </Text>
                {subline(e) ? (
                  <Text v="c1" color="t3">
                    {subline(e)}
                  </Text>
                ) : null}
              </View>
              <Text v="c1" weight="600" color="t2">
                {deadline ? dday(e.startsAt, today) : clock(e.startsAt)}
              </Text>
            </View>
          )
        })
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingTop: theme.spacing[3],
    paddingLeft: theme.spacing[5],
    paddingRight: theme.spacing[3],
  },
  dayButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
  dayTitle: { flexShrink: 1 },
  add: { height: 44, paddingHorizontal: theme.spacing[1], justifyContent: 'center' },
  google: { paddingBottom: theme.spacing[1], paddingHorizontal: theme.spacing[5] },
  empty: { paddingVertical: 36, paddingHorizontal: theme.spacing[5], textAlign: 'center' },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  eventBar: { width: 4, alignSelf: 'stretch', borderRadius: theme.radius.pill, backgroundColor: theme.colors.t4 },
  eventBody: { flex: 1, minWidth: 0 },
}))

export default CalendarView
