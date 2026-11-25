import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon, Text } from '../../../shared/components'

const FilterButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel="필터" onPress={onPress} hitSlop={8} style={styles.button}>
    <Icon name="filter" size={16} />
    <Text v="c1" weight="600">
      필터
    </Text>
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  button: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1], height: 28 },
}))

export default FilterButton
