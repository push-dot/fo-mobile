import { View, type DimensionValue } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = { width: DimensionValue; height: number; radius?: number }

const Skeleton = ({ width, height, radius = 8 }: Props) => <View style={styles.bone(width, height, radius)} />

const styles = StyleSheet.create((theme) => ({
  bone: (width: DimensionValue, height: number, radius: number) => ({ width, height, borderRadius: radius, backgroundColor: theme.colors.fill2 }),
}))

export default Skeleton
