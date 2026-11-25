import { View } from 'react-native'
import { Icon } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { onAccent } from '../../../theme'

const TermCheckbox = ({ checked, size }: { checked: boolean; size: number }) => (
  <View style={[styles.box(size), checked ? styles.boxChecked : styles.boxEmpty]}>
    {checked ? <Icon name="check" size={14} color={onAccent} /> : null}
  </View>
)

const styles = StyleSheet.create((theme) => ({
  box: (size: number) => ({ width: size, height: size, borderRadius: 8, borderColor: theme.colors.t3, alignItems: 'center', justifyContent: 'center' }),
  boxChecked: { borderWidth: 0, backgroundColor: theme.colors.ac },
  boxEmpty: { borderWidth: 2, backgroundColor: 'transparent' },
}))

export default TermCheckbox
