import { useEffect, useState } from 'react'
import { Animated, Easing, Pressable, View } from 'react-native'
import { Icon, Text, useReduceMotion } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { APPLIED_FIT_LABEL, type AppliedFit } from '../utils'
import FitRing from './fit-ring'

const Bar = ({ pct, low, delay }: { pct: number; low: boolean; delay: number }) => {
  const c = useColors()
  const reduce = useReduceMotion()
  const grow = useState(() => new Animated.Value(reduce ? 1 : 0))[0]
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: reduce ? 0 : 900, delay, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start()
  }, [grow, reduce, delay])
  return (
    <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.fill2, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 4,
          backgroundColor: low ? c.orange : c.ac,
          width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.min(100, pct)}%`] }),
        }}
      />
    </View>
  )
}

const AppliedFitCard = ({ fit, onPress }: { fit: AppliedFit; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={APPLIED_FIT_LABEL}
      accessibilityValue={{ text: [`${fit.score}점`, fit.headline].filter(Boolean).join(', ') }}
      onPress={onPress}
      style={({ pressed }) => ({ padding: spacing[5], borderRadius: radius.card, backgroundColor: pressed ? c.fill : c.bg2, gap: spacing[3] })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <FitRing score={fit.score} size={64} />
        <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
          <Text v="c1" weight="700" color="t3" numberOfLines={1}>
            {fit.title}
          </Text>
          {fit.headline ? <Text v="h3">{fit.headline}</Text> : null}
        </View>
        <Icon name="chev" size={18} color="t3" />
      </View>
      {fit.parts.map((p, i) => (
        <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text v="c1" color="t2" style={{ width: 76 }}>
            {p.label}
          </Text>
          <Bar pct={p.pct} low={p.low} delay={150 + i * 80} />
          <Text v="c1" weight="700" style={{ width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
            {p.value}
          </Text>
        </View>
      ))}
      {fit.weakness ? (
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Text v="c1" weight="800" color="orange">
            !
          </Text>
          <Text v="c1" color="t2" style={{ flex: 1 }}>
            {fit.weakness}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

export default AppliedFitCard
