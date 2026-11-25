import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { useColors } from '../../theme'

const ios = Platform.OS === 'ios'

const CtaBar = ({ children, light = false, lift = 0 }: { children: ReactNode; light?: boolean; lift?: number }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={styles.bar(lift, insets.bottom)}
    >
      {ios ? (
        <LinearGradient
          colors={light ? [`${c.bg}B3`, `${c.bg}66`, `${c.bg}00`] : [c.bg, c.bg, `${c.bg}00`]}
          locations={light ? [0, 0.6, 1] : [0, 0.72, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.fade}
        />
      ) : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  bar: (lift: number, insetBottom: number) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: lift,
    zIndex: 4,
    flexDirection: 'row',
    gap: theme.spacing[2],
    paddingTop: 14,
    paddingHorizontal: theme.spacing[4],
    paddingBottom: (lift > 0 ? 0 : insetBottom) + (ios ? 6 : 10),
    backgroundColor: ios ? undefined : theme.colors.bg,
    borderTopWidth: ios ? 0 : 1,
    borderTopColor: theme.colors.line,
  }),
  fade: { position: 'absolute', inset: 0 },
}))

export default CtaBar
