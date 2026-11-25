import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

const Band = ({ style }: { style?: object }) => <View style={[styles.band, style]} />

const styles = StyleSheet.create((theme) => ({
  band: { height: 10, backgroundColor: theme.colors.bg2 },
}))

export default Band
