import { useState } from 'react'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'
import type { Fact } from '../utils/material-view'

/**
 * The detail card (`.dmeta`): a grid whose label column is as wide as its widest label (`auto minmax(0,1fr)`, 12 apart).
 * Each label reports its natural width and every label then takes the widest, so the values line up as the board's do.
 * The card's own 14 above and below are the board's `dl` margins, which a flex column keeps on top of the sheet gap.
 */
const MaterialFacts = ({ facts }: { facts: Fact[] }) => {
  const c = useColors()
  const [labelWidth, setLabelWidth] = useState(0)
  return (
    <View
      style={{
        gap: spacing[2],
        marginVertical: 14,
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
