import { Pressable } from 'react-native'
import { Icon } from '../../../shared/components'

const ProfileAction = ({ icon, label, onPress }: { icon: 'share' | 'paper'; label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={{ height: 44, minWidth: 40, alignItems: 'center', justifyContent: 'center' }}>
    <Icon name={icon} size={22} />
  </Pressable>
)

export default ProfileAction
