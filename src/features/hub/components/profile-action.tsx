import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon } from '../../../shared/components'

const ProfileAction = ({ icon, label, onPress }: { icon: 'share' | 'paper'; label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={styles.button}>
    <Icon name={icon} size={22} />
  </Pressable>
)

const styles = StyleSheet.create({
  button: { height: 44, minWidth: 40, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
})

export default ProfileAction
