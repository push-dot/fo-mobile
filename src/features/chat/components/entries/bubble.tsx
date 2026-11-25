import { View, useWindowDimensions } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '../../../../theme'
import Appear from '../motion'

export const BUBBLE_PAD_X = 15

export const useBotBubbleMax = () => (useWindowDimensions().width - spacing[5] * 2) * 0.88

const Bubble = ({ children, gap = 6, wide }: { children: React.ReactNode; gap?: number; wide?: boolean }) => {
  const maxWidth = useBotBubbleMax()
  return (
    <Appear kind="bubble" style={styles.appear(maxWidth, !!wide)}>
      <View style={styles.bubble(maxWidth, gap)}>
        {children}
      </View>
    </Appear>
  )
}

const styles = StyleSheet.create((theme) => ({
  appear: (maxWidth: number, wide: boolean) => ({ alignSelf: 'flex-start', maxWidth, ...(wide ? { width: maxWidth } : null) }),
  bubble: (maxWidth: number, gap: number) => ({ maxWidth, gap, paddingVertical: 11, paddingHorizontal: BUBBLE_PAD_X, borderRadius: theme.radius.lg, borderBottomLeftRadius: theme.radius.xs, backgroundColor: theme.colors.fill }),
}))

export default Bubble
