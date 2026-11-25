import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'

const RADIO = 22

const RadioRow = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={styles.row}>
    <Text v="b1" weight={on ? '700' : '600'} style={styles.label}>
      {label}
    </Text>
    <View style={[styles.radio, on && styles.radioOn]} />
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4], paddingVertical: theme.spacing[4], paddingHorizontal: theme.spacing[1] },
  label: { flex: 1 },
  radio: { width: RADIO, height: RADIO, borderRadius: RADIO / 2, borderWidth: 2, borderColor: theme.colors.t4 },
  radioOn: { borderWidth: 7, borderColor: theme.colors.ac },
}))

export default RadioRow
