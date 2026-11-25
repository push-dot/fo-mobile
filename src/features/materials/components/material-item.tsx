import { Pressable, View } from 'react-native'
import { spacing, type, useColors } from '@/theme'
import { Icon, Text } from '@/shared/components'
import { DELETE_ACTION, DELETE_CONFIRM, PICKED_LABEL, PICK_LABEL, SECTION_LABEL, SEND_LABEL } from '../constants'
import type { Material, MaterialSection } from '../types'
import { materialRow } from '../utils/material-row'
import { useListSize } from './list-size'

export function MaterialItem({
  material,
  now,
  onOpen,
  onSend,
  onDelete,
}: {
  material: Material
  now: Date
  onOpen: (m: Material) => void
  onSend: (m: Material) => void
  onDelete: (m: Material) => void
}) {
  const c = useColors()
  const size = useListSize()
  const row = materialRow(material, now)
  return (
    <View style={{ flexDirection: 'row', gap: spacing[3], minHeight: 68, ...size.row }}>
      <Pressable accessibilityRole="link" accessibilityLabel={`${row.title} 자세히`} onPress={() => onOpen(material)} onLongPress={() => onDelete(material)}
        accessibilityActions={[{ name: DELETE_ACTION, label: DELETE_CONFIRM }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === DELETE_ACTION && onDelete(material)}
        style={{ flex: 1, minWidth: 0, gap: 2 }}>
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
}

export function GroupTitle({ label, count }: { label: string; count?: number }) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={count === undefined ? label : `${label} ${count}`} style={{ flexDirection: 'row', gap: 6, paddingTop: 18, paddingBottom: 6, paddingHorizontal: spacing[5] }}>
      <Text v="c1" weight="700" color="t3">
        {label}
      </Text>
      {count === undefined ? null : (
        <Text v="c1" weight="700" color="t3">
          {count}
        </Text>
      )}
    </View>
  )
}

export function SectionTitle({ section, count }: { section: MaterialSection; count: number }) {
  return <GroupTitle label={SECTION_LABEL[section]} count={count} />
}

export function MaterialPickRow({ title, sub, picked, onToggle }: { title: string; sub: string; picked: boolean; onToggle: () => void }) {
  const c = useColors()
  const size = useListSize()
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: picked }} onPress={onToggle} style={{ flexDirection: 'row', gap: spacing[3], minHeight: 68, ...size.row }}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text v="b1" weight="600" numberOfLines={size.titleLines} style={{ lineHeight: type.b2.lineHeight }}>
          {title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={size.subLines}>
          {sub}
        </Text>
      </View>
      <View style={{ ...size.send, backgroundColor: picked ? c.fill2 : c.fill, justifyContent: 'center' }}>
        <Text v="c1" weight="700" color={picked ? 'ac' : 't1'}>
          {picked ? PICKED_LABEL : PICK_LABEL}
        </Text>
      </View>
    </Pressable>
  )
}

export function MaterialNavRow({ label, onPress }: { label: string; onPress: () => void }) {
  const size = useListSize()
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ flexDirection: 'row', gap: spacing[3], minHeight: 56, ...size.row }}>
      <Text v="b1" weight="600" style={{ flex: 1, lineHeight: type.b2.lineHeight }}>
        {label}
      </Text>
      <Icon name="chev" size={16} color="t3" />
    </Pressable>
  )
}
