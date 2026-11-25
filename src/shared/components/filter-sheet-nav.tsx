import { PlatformColor, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { hitSlopTo, type } from '../../theme'
import Text from './text'

const NAV_HEIGHT = 52
const RESET_MIN_WIDTH = 56

const FilterSheetNav = ({ title, onReset }: { title: string; onReset: () => void }) => (
  <View style={styles.nav}>
    <View style={styles.spacer} />
    <Text v="h3" weight="600" accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
    <Pressable accessibilityRole="button" onPress={onReset} hitSlop={{ ...hitSlopTo(type.h3.lineHeight), left: 12, right: 12 }} style={styles.reset}>
      <Text v="h3" weight="400" style={styles.resetLabel}>
        초기화
      </Text>
    </Pressable>
  </View>
)

const styles = StyleSheet.create(() => ({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: NAV_HEIGHT },
  spacer: { minWidth: RESET_MIN_WIDTH },
  title: { flex: 1, textAlign: 'center' },
  reset: { minWidth: RESET_MIN_WIDTH, alignItems: 'flex-end' },
  resetLabel: { color: PlatformColor('systemBlue') },
}))

export default FilterSheetNav
