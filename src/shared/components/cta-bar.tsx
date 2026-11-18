import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, useColors } from '../../theme'

const ios = Platform.OS === 'ios'

/** `light`: only a faint fade behind the buttons, so a page scrolling under the bar stays visible (the web detail pages). */
const CtaBar = ({ children, light = false }: { children: ReactNode; light?: boolean }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 4,
        flexDirection: 'row',
        gap: spacing[2],
        paddingTop: 14,
        paddingHorizontal: spacing[4],
        paddingBottom: insets.bottom + (ios ? 6 : 10),
        backgroundColor: ios ? undefined : c.bg,
        borderTopWidth: ios ? 0 : 1,
        borderTopColor: c.line,
      }}
    >
      {ios ? (
        <LinearGradient
          colors={light ? [`${c.bg}B3`, `${c.bg}66`, `${c.bg}00`] : [c.bg, c.bg, `${c.bg}00`]}
          locations={light ? [0, 0.6, 1] : [0, 0.72, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{ position: 'absolute', inset: 0 }}
        />
      ) : null}
      {children}
    </View>
  )
}

export default CtaBar
