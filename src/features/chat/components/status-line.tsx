import { useContext, useEffect, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Mascot, Text } from '@/shared/components'
import { useXlChrome } from '@/shared/components/xl-chrome'
import { largeType } from '../../../theme'
import type { MascotColor } from '../../../theme/mascot'
import { statusLineView, type LiveLine, type StatusLineView } from '../utils/status-line'
import { ChatBotColor } from './chat-bot-color'

const TONE_COLOR = { neutral: 't2', help: 'orange', quiet: 't3' } as const

const StatusLineRow = ({ view, color }: { view: StatusLineView; color: MascotColor }) => {
  const { xl } = useXlChrome()
  const big = xl ? largeType : null
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={view.accessibilityLabel}
      style={styles.row}
    >
      <Mascot size={xl ? 28 : 24} state={view.mascot} color={color} motion={{ mode: view.still ? 'still' : 'animate' }} />
      <View style={[styles.body, xl && styles.bodyWrap]}>
        {view.text ? (
          <Text v="b2" weight="600" color={TONE_COLOR[view.tone]} numberOfLines={xl ? undefined : 1} allowFontScaling={!xl} style={[styles.text, big?.b2]}>
            {view.text}
          </Text>
        ) : null}
        {view.tail ? (
          <Text v="c1" color="t3" allowFontScaling={!xl} style={[styles.tail, big?.c1]}>
            {view.tail}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const StatusLine = ({ line, color }: { line: LiveLine; color?: MascotColor }) => {
  const room = useContext(ChatBotColor)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return <StatusLineRow view={statusLineView(line, now)} color={color ?? room} />
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, alignSelf: 'stretch' },
  body: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'baseline', columnGap: theme.spacing[2] },
  bodyWrap: { flexWrap: 'wrap' },
  text: { flexShrink: 1 },
  tail: { fontVariant: ['tabular-nums'] },
}))

export default StatusLine
