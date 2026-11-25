import { brandColor } from '@push/shared'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { onAccent } from '../../../theme'

const LOGO_RADIUS: Record<number, number> = { 44: 14, 48: 15, 56: 16 }

const Logo = ({ name, size = 48, mono }: { name: string; size?: number; mono?: boolean }) => (
  <View style={styles.box(size, mono ? undefined : brandColor(name))}>
    <Text v={size >= 56 ? 'h2' : 'h3'} weight="800" style={mono ? styles.initialMono : styles.initial}>
      {[...name][0]}
    </Text>
  </View>
)

const styles = StyleSheet.create((theme) => ({
  box: (size: number, brand?: string) => ({
    width: size,
    height: size,
    borderRadius: LOGO_RADIUS[size] ?? theme.radius.sm,
    backgroundColor: brand ?? theme.colors.t1,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  initial: { color: onAccent },
  initialMono: { color: theme.colors.bg },
}))

export default Logo
