import { Animated, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon, Text, useGrow } from '@/shared/components'
import { APPLIED_FIT_LABEL, type AppliedFit } from '../utils'
import FitRing from './fit-ring'

const Bar = ({ pct, low, delay }: { pct: number; low: boolean; delay: number }) => {
  const grow = useGrow(delay)
  const fillWidth = { width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.min(100, pct)}%`] }) }
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, low && styles.fillLow, fillWidth]} />
    </View>
  )
}

const AppliedFitCard = ({ fit, onPress }: { fit: AppliedFit; onPress: () => void }) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={APPLIED_FIT_LABEL}
      accessibilityValue={{ text: `${fit.score}점` }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.head}>
        <FitRing score={fit.score} kind="card" />
        <View style={styles.title}>
          <Text v="c1" weight="700" color="t3" numberOfLines={1}>
            {fit.title}
          </Text>
        </View>
        <Icon name="chev" size={18} color="t3" />
      </View>
      {fit.parts.map((p, i) => (
        <View key={p.label} style={styles.part}>
          <Text v="c1" color="t2" style={styles.partLabel}>
            {p.label}
          </Text>
          <Bar pct={p.pct} low={p.low} delay={150 + i * 80} />
          <Text v="c1" weight="700" style={styles.partValue}>
            {p.value}
          </Text>
        </View>
      ))}
      {fit.weakness ? (
        <View style={styles.weakness}>
          <Text v="c1" weight="800" color="orange">
            !
          </Text>
          <Text v="c1" color="t2" style={styles.weaknessText}>
            {fit.weakness}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: theme.colors.fill2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: theme.colors.ac },
  fillLow: { backgroundColor: theme.colors.orange },
  card: { padding: theme.spacing[5], borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2, gap: theme.spacing[3] },
  cardPressed: { backgroundColor: theme.colors.fill },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4] },
  title: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  part: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  partLabel: { width: 76 },
  partValue: { width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] },
  weakness: { flexDirection: 'row', gap: theme.spacing[2] },
  weaknessText: { flex: 1 },
}))

export default AppliedFitCard
