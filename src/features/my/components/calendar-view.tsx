import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { monthDay } from '@push/shared'
import { router } from 'expo-router'
import { Icon, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { useCalendarEvents } from '../api/hooks'
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

/** The board's MyCalendar: the day title (opens the month sheet), the add button and that day's list. */
const CalendarView = () => {
  const c = useColors()
  const today = useMemo(() => new Date(), [])
  const selected = useCalendarDay((s) => s.day)
  const from = useMemo(() => new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()), [selected])
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1)
  const { data } = useCalendarEvents(from.toISOString(), to.toISOString())
  const dayEvents = [...(data?.data ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingTop: spacing[3], paddingLeft: spacing[5], paddingRight: spacing[3] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${dayTitle(selected, today)}, 달력 열기`}
          onPress={() => router.push('/activity/calendar')}
          style={{ flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}
        >
          <Text v="h2" accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>
            {dayTitle(selected, today)}
          </Text>
          <Icon name="down" size={20} color="t1" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="일정 추가"
          onPress={() => router.push({ pathname: '/activity/add-event', params: { day: toDayParam(selected) } })}
          style={{ height: 44, paddingHorizontal: spacing[1], justifyContent: 'center' }}
        >
          <Text v="h3" weight="600" color="acText">
            추가
          </Text>
        </Pressable>
      </View>
      {data ? (
        <Text v="c1" color="t3" style={{ paddingBottom: spacing[1], paddingHorizontal: spacing[5] }}>
          {data.google.connected ? 'Google 캘린더 연결됨' : 'Google 연결 안 됨'}
        </Text>
      ) : null}
      {dayEvents.length === 0 ? (
        <Text v="b2" color="t3" style={{ paddingVertical: 36, paddingHorizontal: spacing[5], textAlign: 'center' }}>
          이날은 일정이 없어요.
        </Text>
      ) : (
        dayEvents.map((e) => {
          const deadline = e.type === 'DEADLINE'
          return (
            <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[5] }}>
              <View style={{ width: 4, alignSelf: 'stretch', borderRadius: radius.pill, backgroundColor: c.t4 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
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

export default CalendarView
