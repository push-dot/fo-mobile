import { LinearGradient } from 'expo-linear-gradient'
import { useState, type ReactNode } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, useColors } from '../../theme'

/** A header that floats over its list: no fill, and once the list has scrolled a light fade keeps the title readable. */
export const useFloatingHeader = () => {
  const [scrolled, setScrolled] = useState(false)
  const [height, setHeight] = useState(0)
  const { top } = useSafeAreaInsets()
  return {
    scrolled,
    onHeight: setHeight,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      setScrolled(e.nativeEvent.contentOffset.y > 0),
    // `contentInsetAdjustmentBehavior="automatic"` already adds the status-bar inset; the header's measured height counts it too, so take it off once.
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
          // Nearly solid across the header row so what scrolls under the title stays out of its way, then fading out below it.
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
