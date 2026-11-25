import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { DELETE_ACTION, DELETE_CONFIRM, SEND_LABEL } from '../constants'
import type { Material } from '../types'
import { materialRow } from '../utils/material-row'
import { useListSize } from './list-size'

const MaterialItem = ({
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
}) => {
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

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing[3], minHeight: 68 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { lineHeight: theme.type.b2.lineHeight },
  send: { backgroundColor: theme.colors.fill, justifyContent: 'center' },
  sendActive: { backgroundColor: theme.colors.fill2, justifyContent: 'center' },
}))

export default MaterialItem
