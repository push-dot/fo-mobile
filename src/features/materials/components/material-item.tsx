import { memo } from 'react'
import { Pressable, View, useWindowDimensions } from 'react-native'
import { radius, spacing, type, useColors } from '@/theme'
import { Text } from '@/shared/components'
import { LARGE_TEXT_SCALE, SECTION_LABEL, SEND_LABEL } from '../constants'
import type { Material, MaterialSection } from '../types'
import { materialRow } from '../utils/material-row'

const SEND_HEIGHT = 34

/** Materials: one row, `.mrow`. The text opens the detail sheet, 보내기 sends. Memoised: a list holds hundreds. */
export const MaterialItem = memo(function MaterialItem({
  material,
  now,
  onOpen,
  onSend,
}: {
  material: Material
  now: Date
  onOpen: (m: Material) => void
  onSend: (m: Material) => void
}) {
  const c = useColors()
  const large = useWindowDimensions().fontScale > LARGE_TEXT_SCALE
  const row = materialRow(material, now)
  return (
    <View style={{ flexDirection: 'row', alignItems: large ? 'flex-start' : 'center', gap: spacing[3], minHeight: 68, paddingVertical: large ? spacing[3] : 10, paddingLeft: spacing[5], paddingRight: spacing[4] }}>
      <Pressable accessibilityRole="link" accessibilityLabel={`${row.title} 자세히`} onPress={() => onOpen(material)} style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text v="b1" weight="600" numberOfLines={large ? 2 : 1} style={{ lineHeight: type.b2.lineHeight }}>
          {row.title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={large ? undefined : 1}>
          {row.sub}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.title} ${SEND_LABEL}`}
        onPress={() => onSend(material)}
        hitSlop={{ top: 7, bottom: 7 }}
        style={({ pressed }) => ({ minHeight: SEND_HEIGHT, paddingHorizontal: 13, borderRadius: radius.chip, backgroundColor: pressed ? c.fill2 : c.fill, justifyContent: 'center' })}
      >
        <Text v="c1" weight="700">
          {SEND_LABEL}
        </Text>
      </Pressable>
    </View>
  )
})

/** `.msec`: "서류 8". */
export const SectionTitle = memo(function SectionTitle({ section, count }: { section: MaterialSection; count: number }) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`${SECTION_LABEL[section]} ${count}`} style={{ flexDirection: 'row', gap: 6, paddingTop: 18, paddingBottom: 6, paddingHorizontal: spacing[5] }}>
      <Text v="c1" weight="700" color="t3">
        {SECTION_LABEL[section]}
      </Text>
      <Text v="c1" weight="700" color="t3">
        {count}
      </Text>
    </View>
  )
})
