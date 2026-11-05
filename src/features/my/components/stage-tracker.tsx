import type { Application } from '@push/api-client'
import { monthDay } from '@push/shared'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { useColors } from '../../../theme'
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
          <View key={s.label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ height: 14, alignSelf: 'stretch', justifyContent: 'center' }}>
              {i > 0 ? (
                <View style={{ position: 'absolute', left: 0, right: '50%', height: 2, backgroundColor: on ? c.ac : c.line }} />
              ) : null}
              {i < steps.length - 1 ? (
                <View
                  style={{
                    position: 'absolute',
                    left: '50%',
                    right: 0,
                    height: 2,
                    backgroundColor: steps[i + 1]!.state !== 'todo' ? c.ac : c.line,
                  }}
                />
              ) : null}
              <View
                style={{
                  alignSelf: 'center',
                  width: s.state === 'now' ? 14 : 10,
                  height: s.state === 'now' ? 14 : 10,
                  borderRadius: 7,
                  backgroundColor: on ? c.ac : c.line,
                  borderWidth: s.state === 'now' ? 3 : 0,
                  borderColor: c.acSoft,
                }}
              />
            </View>
            <Text v="c1" weight={on ? '700' : '400'} color={on ? 't1' : 't3'}>
              {s.label}
            </Text>
            {s.date ? (
              <Text v="c2" color="t3">
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: c.bg }}>
      <View style={{ width: 40, height: 44, borderRadius: 12, backgroundColor: c.bg2, alignItems: 'center', justifyContent: 'center' }}>
        <Text v="c2" color="t3">
          {d.getMonth() + 1}월
        </Text>
        <Text v="b1" weight="800">
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
    <View style={{ padding: 20, borderRadius: 20, backgroundColor: c.bg2, gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
