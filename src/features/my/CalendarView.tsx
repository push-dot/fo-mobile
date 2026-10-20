import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useColors, type Colors } from '../../theme'
import { BottomSheet, Chip, GlassButton, Text, TextField } from '../../ui'
import { myApi, type CalendarEvent, type CalendarEventType } from './api'
import { clock, dayTitle, dday, monthDay, monthGrid, sameDay } from './lib'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']
// Colour per event type (feature-spec 8: 면접 · 마감 · 후속 연락 · 커피챗 · 직접 추가).
const TYPES: { key: CalendarEventType; label: string; color: keyof Colors }[] = [
  { key: 'INTERVIEW', label: '면접', color: 'ac' },
  { key: 'DEADLINE', label: '마감', color: 'red' },
  { key: 'FOLLOW_UP', label: '후속 연락', color: 'green' },
  { key: 'COFFEE_CHAT', label: '커피챗', color: 'orange' },
  { key: 'CUSTOM', label: '직접 추가', color: 't4' },
]
const typeOf = (k: CalendarEventType) => TYPES.find((t) => t.key === k)!

const subline = (e: CalendarEvent) => {
  const mins = e.endsAt ? Math.round((Date.parse(e.endsAt) - Date.parse(e.startsAt)) / 60_000) : 0
  const dur = mins >= 60 ? `${mins / 60}시간` : mins > 0 ? `${mins}분` : ''
  return [dur, e.notes].filter(Boolean).join(' · ')
}

function AddEvent({ day, visible, onClose }: { day: Date; visible: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CalendarEventType>('CUSTOM')
  const add = useMutation({
    mutationFn: () =>
      myApi.addEvent({
        type,
        title: title.trim(),
        startsAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9).toISOString(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar'] })
      setTitle('')
      onClose()
    },
  })
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="어떤 일정을 추가할까요?"
      description={`${monthDay(day.toISOString())} 오전 9:00`}
      action={{
        label: '일정 추가하기',
        onPress: () => add.mutate(),
        disabled: !title.trim() || add.isPending,
      }}
    >
      <TextField
        placeholder="일정 이름"
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="일정 이름"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TYPES.map((t) => (
          <Chip key={t.key} label={t.label} on={type === t.key} onPress={() => setType(t.key)} />
        ))}
      </View>
    </BottomSheet>
  )
}

/** 내 활동 › 캘린더: month grid with type dots, the chosen day's events, Google 연결 상태, + 일정 추가. */
export function CalendarView() {
  const c = useColors()
  const today = useMemo(() => new Date(), [])
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [adding, setAdding] = useState(false)

  const cells = useMemo(() => monthGrid(month.getFullYear(), month.getMonth()), [month])
  const from = cells[0]!
  const to = new Date(cells[cells.length - 1]!.getTime() + 86_400_000)
  const { data } = useQuery({
    queryKey: ['calendar', from.toISOString()],
    queryFn: () => myApi.calendar(from.toISOString(), to.toISOString()),
  })
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
            { icon: 'plus', label: '일정 추가', active: true, onPress: () => setAdding(true) },
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
      <AddEvent day={selected} visible={adding} onClose={() => setAdding(false)} />
    </View>
  )
}
