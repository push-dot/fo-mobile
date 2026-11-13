import { Platform, View } from 'react-native'
import { radius, useColors } from '../../../../theme'
import type { HeaderLight } from './state'

/** The chat header never animates: it only shows a lamp on the bot's mascot. */
export const HeaderLamp = ({ light }: { light: HeaderLight }) => {
  const c = useColors()
  if (light === 'none') return null
  const color = light === 'new' ? c.green : c.red
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: radius.pill, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 11, height: 11, borderRadius: radius.pill, backgroundColor: color, ...(Platform.OS === 'ios' ? { shadowColor: color, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } } : { boxShadow: `0 0 8px ${color}` }) }} />
    </View>
  )
}
