import { BlurView } from 'expo-blur'
import type { StyleProp, ViewStyle } from 'react-native'
import { useThemeMode } from '../../theme'

// iOS ignores the RN `filter` blur, so it gets the native view.
const Blur = ({ intensity, style }: { intensity: number; style?: StyleProp<ViewStyle> }) => (
  <BlurView intensity={intensity} tint={useThemeMode()} style={style} />
)

export default Blur
