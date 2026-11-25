import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { PICKED_LABEL, PICK_LABEL } from '../constants'
import { useListSize } from './list-size'

const MaterialPickRow = ({ title, sub, picked, onToggle }: { title: string; sub: string; picked: boolean; onToggle: () => void }) => {
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

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing[3], minHeight: 68 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { lineHeight: theme.type.b2.lineHeight },
  send: { backgroundColor: theme.colors.fill, justifyContent: 'center' },
  sendActive: { backgroundColor: theme.colors.fill2, justifyContent: 'center' },
}))

export default MaterialPickRow
