import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Mascot, Text } from '@/shared/components'
import { useXlChrome } from '@/shared/components/xl-chrome'
import { largeType, spacing } from '../../../theme'
import type { MascotColor } from '../../../theme/mascot'
import { lineFromWorking, statusLineView, type LiveLine, type StatusLine as StatusLineModel, type StatusLineView } from '../utils/status-line'

const TONE_COLOR = { neutral: 't2', quiet: 't3', help: 'orange', danger: 'red' } as const

const StatusLineRow = ({ view, color }: { view: StatusLineView; color: MascotColor }) => {
  const { xl } = useXlChrome()
  const big = xl ? largeType : null
  return (
    <View
      accessibilityRole={view.role === 'alert' ? 'alert' : undefined}
      accessibilityLiveRegion={view.role === 'alert' ? 'assertive' : 'polite'}
      accessibilityLabel={view.accessibilityLabel}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, alignSelf: 'stretch' }}
    >
      <Mascot size={xl ? 28 : 24} state={view.mascot} color={color} motion={view.mascot === 'idle' ? { mode: 'still' } : { mode: 'animate' }} />
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: xl ? 'wrap' : 'nowrap', alignItems: 'baseline', columnGap: spacing[2] }}>
        <Text v="b2" weight="600" color={TONE_COLOR[view.tone]} numberOfLines={xl ? undefined : 1} allowFontScaling={!xl} style={[{ flexShrink: 1 }, big?.b2]}>
          {view.text}
        </Text>
        {view.tail ? (
          <Text v="c1" color="t3" allowFontScaling={!xl} style={[{ fontVariant: ['tabular-nums'] }, big?.c1]}>
            {view.tail}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const StatusLine = ({ line, color = 'push' }: { line: StatusLineModel; color?: MascotColor }) => {
  const ticking = line.kind === 'run' || line.kind === 'waiting'
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!ticking) return
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [ticking])
  return <StatusLineRow view={statusLineView(line, ticking ? now : new Date())} color={color} />
}

export default StatusLine

type StatusRowProps = { verbs: string[]; startedAt: number; onStop: () => void; color?: MascotColor }

export const StatusRow = ({ verbs, startedAt, color }: StatusRowProps) => <StatusLine line={lineFromWorking(verbs, new Date(startedAt))} color={color} />

export const AwaitingRow = ({ text, color }: { text: string; color?: MascotColor }) => {
  const [since] = useState(() => new Date())
  const line: LiveLine = { kind: 'waiting', since, for: text.startsWith('확인') ? 'confirm' : 'answer', cardId: 'awaiting', text }
  return <StatusLine line={line} color={color} />
}
