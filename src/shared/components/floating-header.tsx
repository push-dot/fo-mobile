import { LinearGradient } from 'expo-linear-gradient'
import { useState, type ReactNode } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, useColors } from '../../theme'

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
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}
      onLayout={(e) => onHeight(e.nativeEvent.layout.height)}
    >
      {scrolled ? (
        <LinearGradient
          pointerEvents="none"
          colors={[`${c.bg}F2`, `${c.bg}F2`, `${c.bg}00`]}
          locations={[0, 0.7, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -spacing[3] }}
        />
      ) : null}
      {children}
    </View>
  )
}

export default FloatingHeader
