import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { monthDay } from '@push/shared'
import { router } from 'expo-router'
import { GlassButton, Text } from '@/shared/components'
import { useColors, type Colors } from '../../../theme'
import { useCalendarEvents } from '../api/hooks'
import { EVENT_TYPES } from '../constants'
import type { CalendarEvent, CalendarEventType } from '../types'
import { CALENDAR_ADD, clock, dayTitle, dday, monthGrid, sameDay, toDayParam } from '../utils'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']
const EVENT_COLOR: Record<CalendarEventType, keyof Colors> = {
  INTERVIEW: 'ac',
  DEADLINE: 'red',
  FOLLOW_UP: 'green',
  COFFEE_CHAT: 'orange',
  CUSTOM: 't4',
}
const typeOf = (k: CalendarEventType) => ({ ...EVENT_TYPES.find((t) => t.key === k)!, color: EVENT_COLOR[k] })

const subline = (e: CalendarEvent) => {
  const mins = e.endsAt ? Math.round((Date.parse(e.endsAt) - Date.parse(e.startsAt)) / 60_000) : 0
  const dur = mins >= 60 ? `${mins / 60}시간` : mins > 0 ? `${mins}분` : ''
  return [dur, e.notes].filter(Boolean).join(' · ')
}

const CalendarView = () => {
  const c = useColors()
  const today = useMemo(() => new Date(), [])
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)

  const cells = useMemo(() => monthGrid(month.getFullYear(), month.getMonth()), [month])
  const from = cells[0]!
  const to = new Date(cells[cells.length - 1]!.getTime() + 86_400_000)
  const { data } = useCalendarEvents(from.toISOString(), to.toISOString())
  const events = data?.data ?? []
  const onDay = (d: Date) => events.filter((e) => sameDay(new Date(e.startsAt), d))
  const dayEvents = onDay(selected).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingTop: 14,
          paddingBottom: 6,
          paddingHorizontal: 20,
        }}
      >
        <Text v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </Text>
        <GlassButton actions={[{ icon: 'back', label: '이전 달', onPress: () => shift(-1) }]} />
        <GlassButton actions={[{ icon: 'chev', label: '다음 달', onPress: () => shift(1) }]} />
        <GlassButton
          actions={[
            { icon: 'plus', label: CALENDAR_ADD, active: true, onPress: () => router.push({ pathname: '/activity/add-event', params: { day: toDayParam(selected) } }) },
          ]}
        />
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
        {WEEK.map((w, i) => (
          <Text
            key={w}
            v="c2"
            weight="700"
            color={i === 0 ? 'red' : 't3'}
            style={{ flex: 1, textAlign: 'center' }}
          >
            {w}
          </Text>
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingTop: 4,
          paddingBottom: 8,
          paddingHorizontal: 12,
        }}
      >
        {cells.map((d) => {
          const inMonth = d.getMonth() === month.getMonth()
          const isSel = sameDay(d, selected)
          const isToday = sameDay(d, today)
          const types = [...new Set(onDay(d).map((e) => e.type))]
          return (
            <Pressable
              key={d.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={`${dayTitle(d, today)}${types.length ? `, 일정 ${onDay(d).length}개` : ''}`}
              accessibilityState={{ selected: isSel }}
              onPress={() => setSelected(d)}
              style={{ width: `${100 / 7}%`, height: 44, alignItems: 'center', gap: 2 }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSel ? c.t1 : 'transparent',
                }}
              >
                <Text
                  weight={isSel || isToday ? '800' : '600'}
                  style={{
                    fontSize: 14,
                    lineHeight: 18,
                    color: isSel ? c.bg : isToday ? c.acText : inMonth ? c.t1 : c.t4,
                  }}
                >
                  {d.getDate()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 2, height: 5 }}>
                {types.slice(0, 3).map((t) => (
                  <View
                    key={t}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: c[typeOf(t).color],
                    }}
                  />
                ))}
              </View>
            </Pressable>
          )
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4, paddingBottom: 12, paddingHorizontal: 20 }}>
        {[...EVENT_TYPES.map((t) => ({ label: t.label, color: c[EVENT_COLOR[t.key]] })), { label: 'Google 캘린더', color: c.green }].map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: l.color }} />
            <Text v="c2" weight="600" color="t3">
              {l.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ height: 10, backgroundColor: c.bg2 }} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingTop: 16,
          paddingHorizontal: 20,
        }}
      >
        <Text v="h3">{dayTitle(selected, today)}</Text>
        {data ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: data.google.connected ? c.green : c.t4,
              }}
            />
            <Text v="c1" weight="600" color="t3">
              {data.google.connected ? 'Google 캘린더' : 'Google 연결 안 됨'}
            </Text>
          </View>
        ) : null}
      </View>
      {dayEvents.length === 0 ? (
        <Text v="b2" color="t3" style={{ paddingVertical: 20, paddingHorizontal: 20 }}>
          이날은 일정이 없어요.
        </Text>
      ) : (
        dayEvents.map((e) => {
          const t = typeOf(e.type)
          const deadline = e.type === 'DEADLINE'
          return (
            <View
              key={e.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  borderRadius: 2,
                  backgroundColor: c[t.color],
                }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text v="c2" weight="700" color="t3">
                  {deadline ? `마감 · ${monthDay(e.startsAt)}` : t.label}
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
