import { LinearGradient } from 'expo-linear-gradient'
import { useState, type ReactNode } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { useColors } from '../../theme'

export const useFloatingHeader = () => {
  const [scrolled, setScrolled] = useState(false)
  const [height, setHeight] = useState(0)
  const { top } = useSafeAreaInsets()
  return {
    scrolled,
    onHeight: setHeight,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      setScrolled(e.nativeEvent.contentOffset.y > 0),
    inset: Math.max(height - top, 0),
  }
}

const FloatingHeader = ({
  scrolled,
  onHeight,
  children,
}: {
  scrolled: boolean
  onHeight: (height: number) => void
  children: ReactNode
}) => {
  const c = useColors()
  return (
    <View
      style={styles.header}
      onLayout={(e) => onHeight(e.nativeEvent.layout.height)}
    >
      {scrolled ? (
        <LinearGradient
          pointerEvents="none"
          colors={[`${c.bg}F2`, `${c.bg}F2`, `${c.bg}00`]}
          locations={[0, 0.7, 1]}
          style={styles.fade}
        />
      ) : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -theme.spacing[3] },
}))

export default FloatingHeader
