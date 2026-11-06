import { BlurView } from 'expo-blur'
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useThemeMode } from '../../theme'

// iOS ignores the RN `filter` blur, so it gets the native view; Android blurs the content itself and only takes a veil.
const Blur = ({ intensity, style }: { intensity: number; style?: StyleProp<ViewStyle> }) => {
  const mode = useThemeMode()
  const c = useColors()
  return Platform.OS === 'ios' ? <BlurView intensity={intensity} tint={mode} style={style} /> : <View style={[{ backgroundColor: c.bg, opacity: 0.2 }, style]} />
}

export default Blur
