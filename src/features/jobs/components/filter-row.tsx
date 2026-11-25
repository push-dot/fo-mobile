import { Pressable } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'

const FilterRow = ({ label, count, on, check, onPress }: { label: string; count: string; on: boolean; check?: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.row, on && styles.rowOn]}>
    <Text v="b1" weight={on ? '700' : '400'} color="t1" style={styles.label} numberOfLines={1}>
      {label}
    </Text>
    {count ? (
      <Text v="c1" weight={on ? '700' : undefined} color={on ? 't1' : 't3'}>
        {count}
      </Text>
    ) : null}
    {on && check ? <Icon name="check" size={16} color="t1" /> : null}
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], height: 46, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.sm },
  rowOn: { backgroundColor: theme.colors.acSoft },
  label: { flex: 1 },
}))

export default FilterRow
