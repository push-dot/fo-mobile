import { useState } from 'react'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import type { Fact } from '../utils/material-view'

const MaterialFacts = ({ facts }: { facts: Fact[] }) => {
  const [labelWidth, setLabelWidth] = useState(0)
  return (
    <View style={styles.card}>
      {facts.map((f) => (
        <View key={f.label} style={styles.row}>
          <Text
            v="c1"
            color="t3"
            style={styles.label(labelWidth)}
            onLayout={(e) => setLabelWidth((w) => Math.max(w, Math.ceil(e.nativeEvent.layout.width)))}
          >
            {f.label}
          </Text>
          <Text v="c1" style={styles.value}>
            {f.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: { gap: theme.spacing[2], paddingVertical: 14, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2 },
  row: { flexDirection: 'row', gap: theme.spacing[3] },
  label: (labelWidth: number) => ({ width: labelWidth || undefined, fontSize: 14, lineHeight: 20 }),
  value: { flex: 1, fontSize: 14, lineHeight: 20 },
}))

export default MaterialFacts
