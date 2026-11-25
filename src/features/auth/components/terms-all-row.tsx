import { Pressable } from 'react-native'
import { Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { FIELD_RADIUS, TERMS_ALL } from '../constants'
import TermCheckbox from './term-checkbox'

const TermsAllRow = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={styles.row}>
    <TermCheckbox checked={checked} size={26} />
    <Text v="b1" weight="700">
      {TERMS_ALL}
    </Text>
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], padding: theme.spacing[4], borderRadius: FIELD_RADIUS, backgroundColor: theme.colors.bg2 },
}))

export default TermsAllRow
