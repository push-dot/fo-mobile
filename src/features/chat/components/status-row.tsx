import { useEffect, useState } from 'react'
import { Animated, Platform, Pressable, View } from 'react-native'
import { useColors } from '../../../theme'
import { Glass, Text } from '@/shared/components'
import { Glyph } from './items'
import { usePulse } from '../hooks'
import { formatElapsed } from '../utils/reducer'

type Props = { verbs: string[]; startedAt: number; onStop: () => void }

/**
 * ✻ 맞춰보는 중… 14초 [중지]. Glass pill above the composer on iOS, flat on Android.
 * shortcut: the 2s gradient shimmer is an opacity pulse (no masked-text dependency); swap when one lands.
 */
export const StatusRow = ({ verbs, startedAt, onStop }: Props) => {
  const c = useColors()
  const [now, setNow] = useState(() => Date.now())
  const [i, setI] = useState(0)
  const [seen, setSeen] = useState(verbs)
  if (verbs !== seen) {
    setSeen(verbs)
    setI(0)
  }
  const shimmer = usePulse(true, 2000, 0.5)
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const rotate = setInterval(() => setI((n) => n + 1), 2500)
    return () => (clearInterval(tick), clearInterval(rotate))
  }, [verbs])
  const verb = verbs[i % verbs.length] ?? '생각하는 중…'
  const elapsed = formatElapsed(Math.max(0, Math.floor((now - startedAt) / 1000)))
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: Platform.OS === 'ios' ? 36 : 28, paddingLeft: Platform.OS === 'ios' ? 12 : 8, paddingRight: 4 }}>
      <Glyph />
      <Animated.View style={{ opacity: shimmer }} accessibilityLiveRegion="polite">
        <Text v="b2" weight="600" color="acText">
          {verb}
        </Text>
      </Animated.View>
      <Text v="c1" weight="500" color="t3" style={{ fontVariant: ['tabular-nums'] }}>
        {elapsed}
      </Text>
      <View style={Platform.OS === 'ios' ? undefined : { flex: 1 }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="작업 중지"
        onPress={onStop}
        hitSlop={8}
        style={({ pressed }) => ({ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.fill, transform: [{ scale: pressed ? 0.94 : 1 }] })}
      >
        <Text v="c2" weight="600" color="t3">
          중지
        </Text>
      </Pressable>
    </View>
  )
  return Platform.OS === 'ios' ? <Glass style={{ alignSelf: 'flex-start', borderRadius: 18 }}>{row}</Glass> : row
}
