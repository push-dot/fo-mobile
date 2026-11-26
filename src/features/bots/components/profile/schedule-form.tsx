import { useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Chip, SegmentedControl, Sheet, SheetScroll, Text, TextField, WheelPicker, useSheetScrollMax } from '@/shared/components'
import { spacing } from '../../../../theme'
import { useCreateSchedule } from '../../api/hooks'
import type { BotId, ScheduleCadence } from '../../types'
import {
  CADENCE_ITEMS,
  HOUR_ITEMS,
  SCHEDULE_ASK_NOTE,
  SCHEDULE_HOUR_LABEL,
  SCHEDULE_NEW_TITLE,
  SCHEDULE_PRESETS,
  SCHEDULE_PROMPT_LABEL,
  SCHEDULE_PROMPT_MAX,
  SCHEDULE_PROMPT_PLACEHOLDER,
  SCHEDULE_SAVE,
  SCHEDULE_WHEN_LABEL,
  WEEKDAY_ITEMS,
  scheduleBody,
  scheduleSaveError,
} from '../../utils/schedules'
import { CANCEL_LABEL } from './profile-rows'

const DEFAULT_HOUR = 9
const MONDAY = 1

const ScheduleForm = ({ botId, onDone }: { botId: BotId; onDone: () => void }) => {
  const { create, isPending } = useCreateSchedule(botId)
  const bound = useSheetScrollMax()
  const [prompt, setPrompt] = useState('')
  const [cadence, setCadence] = useState<ScheduleCadence>('DAILY')
  const [weekday, setWeekday] = useState(MONDAY)
  const [hour, setHour] = useState(DEFAULT_HOUR)
  const [error, setError] = useState<string | null>(null)
  const body = scheduleBody({ prompt, cadence, hour, weekday })
  const save = async () => {
    if (!body || isPending) return
    setError(null)
    try {
      await create(body)
      onDone()
    } catch (e) {
      setError(scheduleSaveError(e))
    }
  }
  return (
    <Sheet
      gap={spacing[2]}
      onLayout={bound.onSheetLayout}
      action={{ label: SCHEDULE_SAVE, onPress: () => void save(), disabled: !body, pending: isPending }}
      secondary={{ label: CANCEL_LABEL, onPress: onDone }}
    >
      <Text v="h3" accessibilityRole="header" style={styles.title}>
        {SCHEDULE_NEW_TITLE}
      </Text>
      <Text v="b2" color="t2">
        {SCHEDULE_ASK_NOTE}
      </Text>
      <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text v="c1" weight="700" color="t3">
            {SCHEDULE_PROMPT_LABEL}
          </Text>
          <View style={styles.wrap}>
            {SCHEDULE_PRESETS.map((preset) => (
              <Chip key={preset} label={preset} on={prompt === preset} onPress={() => setPrompt(preset)} />
            ))}
          </View>
          <TextField value={prompt} onChangeText={setPrompt} placeholder={SCHEDULE_PROMPT_PLACEHOLDER} multiline max={SCHEDULE_PROMPT_MAX} accessibilityLabel={SCHEDULE_PROMPT_LABEL} />
        </View>
        <View style={styles.section}>
          <Text v="c1" weight="700" color="t3">
            {SCHEDULE_WHEN_LABEL}
          </Text>
          <SegmentedControl items={CADENCE_ITEMS} value={cadence} onChange={setCadence} />
          {cadence === 'WEEKLY' ? <SegmentedControl items={WEEKDAY_ITEMS} value={String(weekday)} onChange={(day) => setWeekday(Number(day))} /> : null}
        </View>
        <View style={styles.section}>
          <Text v="c1" weight="700" color="t3">
            {SCHEDULE_HOUR_LABEL}
          </Text>
          <WheelPicker items={HOUR_ITEMS} value={String(hour)} onChange={(h) => setHour(Number(h))} accessibilityLabel={SCHEDULE_HOUR_LABEL} short />
        </View>
      </SheetScroll>
      {error ? (
        <Text v="c1" color="red" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  title: { paddingTop: theme.spacing[1] },
  scroll: (maxHeight: number | undefined) => ({ marginTop: theme.spacing[2], maxHeight }),
  section: { gap: theme.spacing[2], paddingBottom: theme.spacing[4] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
}))

export default ScheduleForm
