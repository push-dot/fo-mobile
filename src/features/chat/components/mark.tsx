import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { onAccent } from '../../../theme'

const LOGO_SHAPE: Record<number, { radius: number; font: number }> = {
  34: { radius: 11, font: 14 },
  40: { radius: 13, font: 15 },
  44: { radius: 14, font: 17 },
}

const Mark = ({ text, color, size = 44, round }: { text: string; color: string; size?: number; round?: boolean }) => {
  const shape = round ? undefined : LOGO_SHAPE[size]
  return (
    <View
      style={styles.mark(size, round ? size / 2 : (shape?.radius ?? Math.round(size * 0.31)), round ? undefined : color)}
    >
      <Text weight={round ? '700' : '800'} style={styles.text(size, round ? size * 0.32 : (shape?.font ?? size * 0.38), !!round)}>
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  mark: (size: number, radius: number, color?: string) => ({ width: size, height: size, borderRadius: radius, backgroundColor: color ?? theme.colors.t1, alignItems: 'center', justifyContent: 'center' }),
  text: (size: number, fontSize: number, round: boolean) => ({ color: round ? theme.colors.bg : onAccent, fontSize, lineHeight: size * 0.5 }),
}))

export default Mark
