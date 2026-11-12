import { Pressable, View } from 'react-native'
import { Icon, Text } from '@/shared/components'
import { spacing } from '../../../theme'

const PickRow = ({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] }}
  >
    <View style={{ flex: 1 }}>
      <Text v="b1" weight="700">
        {title}
      </Text>
      <Text v="c1" color="t3">
        {sub}
      </Text>
    </View>
    <Icon name="chev" size={18} color="t4" />
  </Pressable>
)

export default PickRow
