import { Platform, View } from 'react-native'
import { radius, spacing, useColors } from '../../theme'
import Glass from './glass'
import GlassActionButton, { type GlassAction } from './glass-action'

export type { GlassAction }

/** `filled`: Android draws the circle as a solid fill where the design shows one (iOS is always glass). */
const GlassButton = ({ actions, filled }: { actions: GlassAction[]; filled?: boolean }) => {
  const c = useColors()
  const single = actions.length === 1
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: single ? 0 : spacing[1] }}>
      {actions.map((a) => (
        <GlassActionButton key={a.label} a={a} width={single ? 44 : 40} />
      ))}
    </View>
  )
  const shape = { borderRadius: radius.pill, minWidth: 44, height: 44, justifyContent: 'center' } as const
  if (Platform.OS === 'android') return filled ? <View style={[shape, { backgroundColor: c.fill, overflow: 'hidden' }]}>{row}</View> : row
  return (
    <Glass interactive style={shape}>
      {row}
    </Glass>
  )
}

export default GlassButton
