import { Platform, View } from 'react-native'
import { radius, spacing } from '../../theme'
import Glass from './glass'
import { useXlChrome } from './xl-chrome'
import GlassActionButton, { type GlassAction } from './glass-action'

export type { GlassAction }

/** `iconSize` overrides the glyph size (22, or 16 when `filled`).
 * `filled`: the design's solid `fill` icon chip with a 16pt glyph (sheet close buttons), on both platforms.
 * `circle`: the board's `.gbtn` — iOS draws glass, Android a solid `fill` circle (bot, chat and material headers); `.iconbtn` headers leave it off. */
const GlassButton = ({ actions, filled, iconSize, circle }: { actions: GlassAction[]; filled?: boolean; iconSize?: number; circle?: boolean }) => {
  const single = actions.length === 1
  const solid = filled || (circle && Platform.OS === 'android')
  const { button } = useXlChrome()
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: single ? 0 : spacing[1] }}>
      {actions.map((a) => (
        <GlassActionButton key={a.label} a={a} width={single ? button : 40} iconSize={iconSize ?? (filled ? 16 : 22)} filled={solid} />
      ))}
    </View>
  )
  const shape = { borderRadius: radius.pill, minWidth: button, height: button, justifyContent: 'center' } as const
  if (solid || Platform.OS === 'android') return row
  return (
    <Glass interactive style={shape}>
      {row}
    </Glass>
  )
}

export default GlassButton
