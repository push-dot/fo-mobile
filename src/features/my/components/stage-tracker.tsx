import { monthDay } from '@push/shared'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { useNextEvent } from '../api/hooks'
import type { ApplicationDetail } from '../types'
import { eventWhen, stageFlow, stageSteps } from '../utils'


const Steps = ({ a }: { a: ApplicationDetail }) => {
  const steps = stageSteps(a.stage, a.appliedAt, a.stageEnteredAt)
  return (
    <View style={styles.steps}>
      {steps.map((s, i) => {
        const on = s.state !== 'todo'
        return (
          <View key={s.label} style={styles.step}>
            <View style={styles.track}>
              {i > 0 ? (
                <View style={[styles.lineIn, on && styles.on]} />
              ) : null}
              {i < steps.length - 1 ? (
                <View style={[styles.lineOut, steps[i + 1]!.state !== 'todo' && styles.on]} />
              ) : null}
              {s.state === 'now' ? (
                <View style={styles.halo} />
              ) : null}
              <View style={[styles.node, on && styles.on]} />
            </View>
            <Text v="c1" weight={s.state === 'now' ? '700' : '600'} color={on ? 't1' : 't3'}>
              {s.label}
            </Text>
            {s.date ? (
              <Text v="c2" color="t3" style={styles.date}>
                {s.date}
              </Text>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const NextEvent = ({ applicationId }: { applicationId: string }) => {
  const { data: e } = useNextEvent(applicationId)
  if (!e) return null
  const d = new Date(e.startsAt)
  return (
    <View style={styles.next}>
      <View style={styles.calendar}>
        <Text v="tab" weight="400" color="t3">
          {d.getMonth() + 1}월
        </Text>
        <Text v="b2" weight="700" style={styles.calendarDay}>
          {d.getDate()}
        </Text>
      </View>
      <View style={styles.nextBody}>
        <Text v="b2" weight="700" numberOfLines={1}>
          {e.title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {[eventWhen(e.startsAt), e.location].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </View>
  )
}

const StageTracker = ({ a }: { a: ApplicationDetail }) => {
  const applied = monthDay(a.appliedAt)
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text v="h3">{stageFlow(a.stage).headline}</Text>
        {applied ? (
          <Text v="c1" weight="600" color="t2">
            {applied} 지원
          </Text>
        ) : null}
      </View>
      <Steps a={a} />
      <NextEvent applicationId={a.id} />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  steps: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: theme.spacing[2] },
  track: { height: 12, alignSelf: 'stretch', justifyContent: 'center' },
  lineIn: { position: 'absolute', left: 0, right: '50%', height: 2, backgroundColor: theme.colors.fill2 },
  lineOut: { position: 'absolute', left: '50%', right: 0, height: 2, backgroundColor: theme.colors.fill2 },
  halo: { position: 'absolute', alignSelf: 'center', width: 20, height: 20, borderRadius: theme.radius.pill, backgroundColor: theme.colors.acSoft },
  node: { alignSelf: 'center', width: 12, height: 12, borderRadius: theme.radius.pill, backgroundColor: theme.colors.fill2 },
  on: { backgroundColor: theme.colors.ac },
  date: { marginTop: -theme.spacing[1] },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.paper,
  },
  calendar: { width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.bg2, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { lineHeight: 17, fontVariant: ['tabular-nums'] },
  nextBody: { flex: 1, minWidth: 0 },
  card: {
    paddingTop: theme.spacing[5],
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[4],
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.bg2,
    gap: theme.spacing[4],
  },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: theme.spacing[1] },
}))

export default StageTracker
