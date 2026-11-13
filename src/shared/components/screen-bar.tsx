import { useState, type ComponentProps, type ReactNode } from 'react'
import { Platform, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { spacing, useColors } from '../../theme'
import TopBar from './top-bar'

export type ScreenBarScroll = {
  /** Space the list leaves for the floating bar (0 where the bar is not floating). */
  topInset: number
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
}

/**
 * A stack screen's header like the native Apple Stack header: the screen's own background at rest, and the list scrolls visibly
 * under it with a light fade once it moves. Android keeps the solid bar above the list.
 */
const ScreenBar = ({ bar, children }: { bar: ComponentProps<typeof TopBar>; children: (scroll: ScreenBarScroll) => ReactNode }) => {
  const c = useColors()
  const [height, setHeight] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  if (Platform.OS !== 'ios')
    return (
      <>
        <TopBar {...bar} />
        {children({ topInset: 0 })}
      </>
    )
  return (
    <View style={{ flex: 1 }}>
      {children({ topInset: height, onScroll: (e) => setScrolled(e.nativeEvent.contentOffset.y > 0) })}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
        {scrolled ? (
          <LinearGradient pointerEvents="none" colors={[`${c.bg}F2`, `${c.bg}00`]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -spacing[3] }} />
        ) : null}
        <TopBar {...bar} transparent />
      </View>
    </View>
  )
}

export default ScreenBar
