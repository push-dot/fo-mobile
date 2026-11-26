import type { ComponentProps, ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '../../theme'
import GlassButton, { type GlassAction } from './glass-button'
import NativeTopBar from './native-top-bar'
import TopBar from './top-bar'

type ScreenBarScroll = {
  topInset: number
}

const ScreenBar = ({ bar: { actions, ...bar }, children }: { bar: ComponentProps<typeof TopBar> & { actions?: GlassAction[] }; children: (scroll: ScreenBarScroll) => ReactNode }) => {
  const header = useHeaderHeight()
  if (Platform.OS !== 'ios')
    return (
      <>
        <TopBar {...bar} right={bar.right ?? (actions?.length ? <GlassButton actions={actions} /> : undefined)} />
        {children({ topInset: 0 })}
      </>
    )
  return (
    <View style={styles.screen}>
      <NativeTopBar transparent title={bar.title} onBack={bar.onBack ?? (() => undefined)} right={bar.right} actions={actions} />
      {header > 0 ? children({ topInset: header + spacing[2] }) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
})

export type { ScreenBarScroll }

export default ScreenBar
