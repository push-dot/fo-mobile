import { memo } from 'react'
import { Pressable, View } from 'react-native'
import { spacing, type, useColors } from '@/theme'
import { Text } from '@/shared/components'
import { SECTION_LABEL, SEND_LABEL } from '../constants'
import type { Material, MaterialSection } from '../types'
import { materialRow } from '../utils/material-row'
import { useListSize } from './list-size'

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
  const size = useListSize()
  const row = materialRow(material, now)
  return (
    <View style={{ flexDirection: 'row', gap: spacing[3], minHeight: 68, ...size.row }}>
      <Pressable accessibilityRole="link" accessibilityLabel={`${row.title} 자세히`} onPress={() => onOpen(material)} style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text v="b1" weight="600" numberOfLines={size.titleLines} style={{ lineHeight: type.b2.lineHeight }}>
          {row.title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={size.subLines}>
          {row.sub}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.title} ${SEND_LABEL}`}
        onPress={() => onSend(material)}
        hitSlop={{ top: 7, bottom: 7 }}
        style={({ pressed }) => ({ ...size.send, backgroundColor: pressed ? c.fill2 : c.fill, justifyContent: 'center' })}
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
