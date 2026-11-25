import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export const Dot = ({ color, size = 8, top = 8 }: { color: string; size?: number; top?: number }) => (
  <View style={styles.dot(color, size, top)} />
)

const styles = StyleSheet.create({
  dot: (color: string, size: number, top: number) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginTop: top }),
})
