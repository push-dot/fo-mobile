import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
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
  const size = useListSize()
  const row = materialRow(material, now)
  return (
    <View style={[styles.row, size.row]}>
      <Pressable accessibilityRole="link" accessibilityLabel={`${row.title} 자세히`} onPress={() => onOpen(material)} onLongPress={() => onDelete(material)}
        accessibilityActions={[{ name: DELETE_ACTION, label: DELETE_CONFIRM }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === DELETE_ACTION && onDelete(material)}
        style={styles.text}>
        <Text v="b1" weight="600" numberOfLines={size.titleLines} style={styles.title}>
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
        style={({ pressed }) => [size.send, pressed ? styles.sendActive : styles.send]}
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
    <View accessible accessibilityRole="header" accessibilityLabel={count === undefined ? label : `${label} ${count}`} style={styles.group}>
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
  const size = useListSize()
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: picked }} onPress={onToggle} style={[styles.row, size.row]}>
      <View style={styles.text}>
        <Text v="b1" weight="600" numberOfLines={size.titleLines} style={styles.title}>
          {title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={size.subLines}>
          {sub}
        </Text>
      </View>
      <View style={[size.send, picked ? styles.sendActive : styles.send]}>
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
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.navRow, size.row]}>
      <Text v="b1" weight="600" style={styles.navLabel}>
        {label}
      </Text>
      <Icon name="chev" size={16} color="t3" />
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing[3], minHeight: 68 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { lineHeight: theme.type.b2.lineHeight },
  send: { backgroundColor: theme.colors.fill, justifyContent: 'center' },
  sendActive: { backgroundColor: theme.colors.fill2, justifyContent: 'center' },
  group: { flexDirection: 'row', gap: 6, paddingTop: 18, paddingBottom: 6, paddingHorizontal: theme.spacing[5] },
  navRow: { flexDirection: 'row', gap: theme.spacing[3], minHeight: 56 },
  navLabel: { flex: 1, lineHeight: theme.type.b2.lineHeight },
}))
