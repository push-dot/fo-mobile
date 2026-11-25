import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon, Text } from '@/shared/components'
import { useListSize } from './list-size'

const MaterialNavRow = ({ label, onPress }: { label: string; onPress: () => void }) => {
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
  navRow: { flexDirection: 'row', gap: theme.spacing[3], minHeight: 56 },
  navLabel: { flex: 1, lineHeight: theme.type.b2.lineHeight },
}))

export default MaterialNavRow
