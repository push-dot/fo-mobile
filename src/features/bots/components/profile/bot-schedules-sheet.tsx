import { useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Button, Sheet, SheetScroll, SkeletonRows, Switch, Text, showToast, useSheetScrollMax } from '@/shared/components'
import { spacing } from '../../../../theme'
import { useBotSchedules, useDeleteSchedule, useToggleSchedule } from '../../api/hooks'
import type { BotId, BotSchedule } from '../../types'
import {
  SCHEDULES_EMPTY_BODY,
  SCHEDULES_EMPTY_TITLE,
  SCHEDULES_ERROR,
  SCHEDULE_ADD,
  SCHEDULE_DELETE,
  SCHEDULE_DELETE_FAILED,
  SCHEDULE_TOGGLE_FAILED,
  scheduleErrorLine,
  scheduleTiming,
  schedulesTitle,
  schedulesView,
} from '../../utils/schedules'
import { RETRY_LABEL } from './profile-rows'
import ScheduleForm from './schedule-form'

const ROW_MIN = 72
const LOADING_ROWS = 2
const LOADING_LINES = [
  { width: '70%', height: 16 },
  { width: '35%', height: 12 },
] as const

const ScheduleRow = ({ schedule, onToggle, onDelete }: { schedule: BotSchedule; onToggle: (on: boolean) => void; onDelete: () => void }) => {
  const error = scheduleErrorLine(schedule.lastError)
  return (
    <View style={styles.row}>
      <View style={styles.body}>
        <Text v="b1" weight="600" numberOfLines={2} color={schedule.enabled ? 't1' : 't3'}>
          {schedule.prompt}
        </Text>
        <Text v="c1" color="t3">
          {scheduleTiming(schedule)}
        </Text>
        {error ? (
          <Text v="c1" color="red">
            {error}
          </Text>
        ) : null}
      </View>
      <Switch value={schedule.enabled} label={schedule.prompt} onValueChange={onToggle} />
      <Button label={SCHEDULE_DELETE} variant="secondary" size="sm" onPress={onDelete} />
    </View>
  )
}

const BotSchedulesSheet = ({ botId }: { botId: BotId }) => {
  const schedules = useBotSchedules(botId)
  const toggle = useToggleSchedule(botId)
  const remove = useDeleteSchedule(botId)
  const bound = useSheetScrollMax()
  const [adding, setAdding] = useState(false)
  if (adding) return <ScheduleForm botId={botId} onDone={() => setAdding(false)} />
  const list = schedules.data ?? []
  const view = schedulesView({ isLoading: schedules.isLoading, isError: schedules.isError, count: schedules.data ? list.length : null })
  return (
    <Sheet gap={spacing[2]} onLayout={bound.onSheetLayout} action={{ label: SCHEDULE_ADD, onPress: () => setAdding(true) }}>
      <Text v="h3" accessibilityRole="header" style={styles.title}>
        {schedulesTitle(list.length)}
      </Text>
      {view === 'loading' ? <SkeletonRows count={LOADING_ROWS} lines={LOADING_LINES} /> : null}
      {view === 'error' ? (
        <View style={styles.note} accessibilityRole="alert">
          <Text v="b2" color="t2">
            {SCHEDULES_ERROR}
          </Text>
          <Button label={RETRY_LABEL} variant="secondary" size="sm" pending={schedules.isFetching} onPress={schedules.refetch} />
        </View>
      ) : null}
      {view === 'empty' ? (
        <View style={styles.note}>
          <Text v="b1" weight="600">
            {SCHEDULES_EMPTY_TITLE}
          </Text>
          <Text v="b2" color="t2">
            {SCHEDULES_EMPTY_BODY}
          </Text>
        </View>
      ) : null}
      {view === 'list' ? (
        <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout}>
          {list.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              onToggle={(on) => void toggle(schedule.id, on).catch(() => showToast({ message: SCHEDULE_TOGGLE_FAILED, tone: 'error' }))}
              onDelete={() => void remove(schedule.id).catch(() => showToast({ message: SCHEDULE_DELETE_FAILED, tone: 'error' }))}
            />
          ))}
        </SheetScroll>
      ) : null}
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  title: { paddingTop: theme.spacing[1] },
  note: { alignItems: 'flex-start', gap: theme.spacing[2], paddingVertical: theme.spacing[3] },
  scroll: (maxHeight: number | undefined) => ({ marginTop: theme.spacing[2], maxHeight }),
  row: { minHeight: ROW_MIN, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.line },
  body: { flex: 1, gap: 2 },
}))

export default BotSchedulesSheet
