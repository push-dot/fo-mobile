import { Pressable, View } from 'react-native'
import { Text } from '../../../shared/components'
import TermCheckbox from './term-checkbox'

const TermRow = ({ label, badge, required, checked, onPress }: { label: string; badge: string; required: boolean; checked: boolean; onPress: () => void }) => (
  <Pressable
    accessibilityRole="checkbox"
    accessibilityLabel={`${badge} ${label}`}
    accessibilityState={{ checked }}
    onPress={onPress}
    style={{ minHeight: 48, paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
  >
    <TermCheckbox checked={checked} size={24} />
    <View style={{ flex: 1, minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text v="c1" weight="700" color={required ? 'acText' : 't3'} style={{ lineHeight: 24 }}>
        {badge}
      </Text>
      <Text style={{ flex: 1, lineHeight: 24 }}>{label}</Text>
    </View>
  </Pressable>
)

export default TermRow
