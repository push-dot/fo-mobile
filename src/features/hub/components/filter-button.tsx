import { Pressable } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import { spacing } from '../../../theme'

const FilterButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel="필터" onPress={onPress} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1], height: 28 }}>
    <Icon name="filter" size={16} />
    <Text v="c1" weight="600">
      필터
    </Text>
  </Pressable>
)

export default FilterButton
