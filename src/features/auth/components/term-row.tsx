import { Pressable, View } from 'react-native'
import { Text } from '../../../shared/components'
import TermCheckbox from './term-checkbox'
import { spacing, type } from '../../../theme'

const TermRow = ({ label, badge, required, checked, onPress }: { label: string; badge: string; required: boolean; checked: boolean; onPress: () => void }) => (
  <Pressable
    accessibilityRole="checkbox"
    accessibilityLabel={`${badge} ${label}`}
    accessibilityState={{ checked }}
    onPress={onPress}
    style={{ minHeight: 48, paddingVertical: spacing[3], flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}
  >
    <TermCheckbox checked={checked} size={24} />
    <View style={{ flex: 1, minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <Text v="c1" weight="700" color={required ? 'acText' : 't3'} style={{ lineHeight: type.b1.lineHeight }}>
        {badge}
      </Text>
      <Text style={{ flex: 1, lineHeight: type.b1.lineHeight }}>{label}</Text>
    </View>
  </Pressable>
)

export default TermRow
