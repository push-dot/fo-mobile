import { useState, type ComponentProps, type ReactNode } from 'react'
import { Platform, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet } from 'react-native-unistyles'
import { useColors } from '../../theme'
import TopBar from './top-bar'

export type ScreenBarScroll = {
  topInset: number
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
}

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
    <View style={styles.screen}>
      {children({ topInset: height, onScroll: (e) => setScrolled(e.nativeEvent.contentOffset.y > 0) })}
      <View style={styles.bar} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
        {scrolled ? (
          <LinearGradient pointerEvents="none" colors={[`${c.bg}F2`, `${c.bg}00`]} style={styles.fade} />
        ) : null}
        <TopBar {...bar} transparent />
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -theme.spacing[3] },
}))

export default ScreenBar
