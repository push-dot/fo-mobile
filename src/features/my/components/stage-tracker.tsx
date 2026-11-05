import type { Application } from '@push/api-client'
import { monthDay } from '@push/shared'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { useNextEvent } from '../api/hooks'
import { eventWhen, stageFlow, stageSteps } from '../utils'


const Steps = ({ a }: { a: Application }) => {
  const c = useColors()
  const steps = stageSteps(a.stage, a.appliedAt)
  return (
    <View style={{ flexDirection: 'row' }}>
      {steps.map((s, i) => {
        const on = s.state !== 'todo'
        return (
          <View key={s.label} style={{ flex: 1, alignItems: 'center', gap: spacing[2] }}>
            <View style={{ height: 12, alignSelf: 'stretch', justifyContent: 'center' }}>
              {i > 0 ? (
                <View style={{ position: 'absolute', left: 0, right: '50%', height: 2, backgroundColor: on ? c.ac : c.fill2 }} />
              ) : null}
              {i < steps.length - 1 ? (
                <View
                  style={{
                    position: 'absolute',
                    left: '50%',
                    right: 0,
                    height: 2,
                    backgroundColor: steps[i + 1]!.state !== 'todo' ? c.ac : c.fill2,
                  }}
                />
              ) : null}
              {s.state === 'now' ? (
                <View style={{ position: 'absolute', alignSelf: 'center', width: 20, height: 20, borderRadius: radius.pill, backgroundColor: c.acSoft }} />
              ) : null}
              <View
                style={{
                  alignSelf: 'center',
                  width: 12,
                  height: 12,
                  borderRadius: radius.pill,
                  backgroundColor: on ? c.ac : c.fill2,
                }}
              />
            </View>
            <Text v="c1" weight={s.state === 'now' ? '700' : '600'} color={on ? 't1' : 't3'}>
              {s.label}
            </Text>
            {s.date ? (
              <Text v="c2" color="t3" style={{ marginTop: -spacing[1] }}>
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
  const c = useColors()
  const { data: e } = useNextEvent(applicationId)
  if (!e) return null
  const d = new Date(e.startsAt)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: radius.md, backgroundColor: c.paper }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: c.bg2, alignItems: 'center', justifyContent: 'center' }}>
        <Text v="c2" color="t3">
          {d.getMonth() + 1}월
        </Text>
        <Text v="b2" weight="700">
          {d.getDate()}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b2" weight="700" numberOfLines={1}>
          {e.title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {eventWhen(e.startsAt)}
        </Text>
      </View>
    </View>
  )
}

const StageTracker = ({ a }: { a: Application }) => {
  const c = useColors()
  const applied = monthDay(a.appliedAt)
  return (
    <View style={{ paddingTop: spacing[5], paddingHorizontal: spacing[4], paddingBottom: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2, gap: spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing[1] }}>
        <Text v="h3">{stageFlow(a.stage).headline}</Text>
        {applied ? (
          <Text v="c1" color="t3">
            {applied} 지원
          </Text>
        ) : null}
      </View>
      <Steps a={a} />
      <NextEvent applicationId={a.id} />
    </View>
  )
}

export default StageTracker
