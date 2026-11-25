import { useState } from 'react'
import { Animated, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { useColors, type Colors } from '../../../../theme'
import { usePop } from '../../hooks'
import type { ChatItem, ToolState } from '../../types'
import Appear from '../motion'
import Dot from './glyph'
import Rich from './rich'

type Of<K extends ChatItem['type']> = Extract<ChatItem, { type: K }>

const dotColor = (c: Colors, s: ToolState) => ({ run: c.t3, ok: c.green, err: c.red, wait: c.orange })[s]

const Elbow = () => <View style={styles.elbow} />

const ToolLine = ({ item }: { item: Of<'tool'> }) => {
  const c = useColors()
  const [open, setOpen] = useState(false)
  const pop = usePop(item.state === 'ok')
  const extra = item.extra ?? []
  const result = [item.warning, item.result].filter(Boolean).join(' · ')
  const popStyle = { transform: [{ scale: pop }] }
  return (
    <Appear style={styles.tool}>
      <View style={styles.toolRow}>
        <Animated.View style={popStyle}>
          <Dot color={item.warning && item.state === 'ok' ? c.orange : dotColor(c, item.state)} top={7} />
        </Animated.View>
        <Text v="b2" style={styles.flex}>
          <Text v="b2" weight="700">
            {item.action}
          </Text>
          {item.target ? (
            <Text v="b2" color="t3" weight="500">
              {' '}
              {displayName(item.target)}
            </Text>
          ) : null}
        </Text>
      </View>
      {item.error ? (
        <Appear kind="fade" style={styles.detail}>
          <Elbow />
          <Text v="c1" weight="600" color="red" style={[styles.flex, styles.small]}>
            {item.error}
          </Text>
        </Appear>
      ) : result ? (
        <Appear kind="fade" key={item.state} style={styles.detail}>
          <Elbow />
          <View style={styles.result}>
            <Text v="c1" color="t2" style={styles.small}>
              <Rich v="c1" color="t2" style={styles.small} text={result} />
              {extra.length && !open ? (
                <Text
                  v="c1"
                  color="t3"
                  weight="600"
                  style={styles.more}
                  accessibilityRole="button"
                  accessibilityLabel={`${extra.length}줄 더 보기`}
                  onPress={() => setOpen(true)}
                  suppressHighlighting
                >
                  {`  +${extra.length}줄`}
                </Text>
              ) : null}
            </Text>
            {open ? (
              <Appear kind="fade">
                <Pressable accessibilityRole="button" accessibilityLabel="접기" onPress={() => setOpen(false)}>
                  <Text v="c1" color="t2" style={styles.small}>
                    {extra.join('\n')}
                  </Text>
                </Pressable>
              </Appear>
            ) : null}
          </View>
        </Appear>
      ) : null}
    </Appear>
  )
}

const styles = StyleSheet.create((theme) => ({
  elbow: { width: 10, height: 10, marginTop: 2, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.colors.deco, borderBottomLeftRadius: 3 },
  tool: { gap: theme.spacing[1] },
  toolRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex: { flex: 1 },
  small: { fontSize: 14, lineHeight: 20 },
  more: { fontSize: 14 },
  detail: { flexDirection: 'row', gap: theme.spacing[2], paddingLeft: theme.spacing[1] },
  result: { flex: 1, gap: 2 },
}))

export default ToolLine
