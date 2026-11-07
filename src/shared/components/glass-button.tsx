import { Platform, View } from 'react-native'
import { radius, spacing } from '../../theme'
import Glass from './glass'
import GlassActionButton, { type GlassAction } from './glass-action'

export type { GlassAction }

/** `iconSize` overrides the glyph size (22, or 16 when `filled`).
 * `filled`: the design's solid `fill` icon chip with a 16pt glyph (sheet close buttons), on both platforms. */
const GlassButton = ({ actions, filled, iconSize }: { actions: GlassAction[]; filled?: boolean; iconSize?: number }) => {
  const single = actions.length === 1
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: single ? 0 : spacing[1] }}>
      {actions.map((a) => (
        <GlassActionButton key={a.label} a={a} width={single ? 44 : 40} iconSize={iconSize ?? (filled ? 16 : 22)} filled={filled} />
      ))}
    </View>
  )
  const shape = { borderRadius: radius.pill, minWidth: 44, height: 44, justifyContent: 'center' } as const
  if (filled || Platform.OS === 'android') return row
  return (
    <Glass interactive style={shape}>
      {row}
    </Glass>
  )
}

export default GlassButton
