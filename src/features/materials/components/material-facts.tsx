import { useState } from 'react'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'
import type { Fact } from '../utils/material-view'

const MaterialFacts = ({ facts }: { facts: Fact[] }) => {
  const c = useColors()
  const [labelWidth, setLabelWidth] = useState(0)
  return (
    <View
      style={{
        gap: spacing[2],
        paddingVertical: 14,
        paddingHorizontal: spacing[4],
        borderRadius: radius.card,
        backgroundColor: c.bg2,
      }}
    >
      {facts.map((f) => (
        <View key={f.label} style={{ flexDirection: 'row', gap: spacing[3] }}>
          <Text
            v="c1"
            color="t3"
            style={{ width: labelWidth || undefined, fontSize: 14, lineHeight: 20 }}
            onLayout={(e) => setLabelWidth((w) => Math.max(w, Math.ceil(e.nativeEvent.layout.width)))}
          >
            {f.label}
          </Text>
          <Text v="c1" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
            {f.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

export default MaterialFacts
