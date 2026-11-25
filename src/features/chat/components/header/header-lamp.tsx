import { Platform, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { HeaderLight } from './state'

const HeaderLamp = ({ light }: { light: HeaderLight }) => {
  if (light === 'none') return null
  return (
    <View pointerEvents="none" style={styles.ring}>
      <View style={styles.lamp(light === 'new')} />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  ring: { position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: theme.radius.pill, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' },
  lamp: (fresh: boolean) => {
    const color = fresh ? theme.colors.green : theme.colors.red
    return {
      width: 11,
      height: 11,
      borderRadius: theme.radius.pill,
      backgroundColor: color,
      ...(Platform.OS === 'ios' ? { shadowColor: color, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } } : { boxShadow: `0 0 8px ${color}` }),
    }
  },
}))

export default HeaderLamp
