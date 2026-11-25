import { PlatformColor } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Text from './text'

const SheetHead = ({ children }: { children: string }) => (
  <Text v="c1" style={styles.head}>
    {children}
  </Text>
)

const styles = StyleSheet.create((theme) => ({
  head: { color: PlatformColor('secondaryLabel'), paddingTop: 14, paddingBottom: 6, paddingLeft: theme.spacing[4] },
}))

export default SheetHead
