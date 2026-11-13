import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Mascot, Text } from '@/shared/components'
import { lineFromWorking, statusLineView, type LiveLine, type StatusLine as StatusLineModel, type StatusLineView } from '../utils/status-line'

const TONE_COLOR = { neutral: 't2', help: 'orange', danger: 'red' } as const

const StatusLineRow = ({ view }: { view: StatusLineView }) => (
  <View
    accessibilityRole={view.role === 'alert' ? 'alert' : undefined}
    accessibilityLiveRegion={view.role === 'alert' ? 'assertive' : 'polite'}
    accessibilityLabel={view.accessibilityLabel}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, alignSelf: 'stretch' }}
  >
    <Mascot size={24} state={view.mascot} color="push" motion={view.mascot === 'idle' ? { mode: 'still' } : { mode: 'animate' }} />
    <Text v="b2" weight="600" color={TONE_COLOR[view.tone]} numberOfLines={1} style={{ flexShrink: 1 }}>
      {view.text}
    </Text>
    {view.tail ? (
      <Text v="c1" color="t3" style={{ fontVariant: ['tabular-nums'] }}>
        {view.tail}
      </Text>
    ) : null}
  </View>
)

const StatusLine = ({ line }: { line: StatusLineModel }) => {
  const ticking = line.kind === 'run' || line.kind === 'waiting'
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!ticking) return
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [ticking])
  return <StatusLineRow view={statusLineView(line, ticking ? now : new Date())} />
}

export default StatusLine

type StatusRowProps = { verbs: string[]; startedAt: number; onStop: () => void }

export const StatusRow = ({ verbs, startedAt }: StatusRowProps) => <StatusLine line={lineFromWorking(verbs, new Date(startedAt))} />

export const AwaitingRow = ({ text }: { text: string }) => {
  const [since] = useState(() => new Date())
  const line: LiveLine = { kind: 'waiting', since, for: text.startsWith('확인') ? 'confirm' : 'answer', cardId: 'awaiting', text }
  return <StatusLine line={line} />
}
