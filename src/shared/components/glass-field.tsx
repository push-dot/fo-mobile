import type { ReactNode } from 'react'
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useThemeMode } from '../../theme'
import Glass from './glass'

/** The surface of a search input: native glass on iOS (the board's lighter `--glass` tint in dark), a flat `fill` on Android. */
const GlassField = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  if (Platform.OS !== 'ios') return <View style={[{ backgroundColor: c.fill }, style]}>{children}</View>
  return (
    <Glass tint={dark ? c.glass : undefined} style={style}>
      {children}
    </Glass>
  )
}

export default GlassField
