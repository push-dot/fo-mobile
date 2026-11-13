import { View } from 'react-native'
import { radius, useColors } from '../../theme'
import Text from './text'

export type BadgeTone = 'ac' | 'grey' | 'red' | 'green' | 'orange'

/** A bold lead glyph with its own right margin (the board's `.kw-ok:before` / `.kw-miss:before`). */
export type BadgeGlyph = { char: string; gap: number }

const Badge = ({ label, minWidth, glyph }: { label: string; tone?: BadgeTone; minWidth?: number; glyph?: BadgeGlyph }) => {
  const c = useColors()
  // v412 rule 4: one badge colour; the text tells the state, so every tone draws the same grey.
  // Rule 21: only 합격 is black (white in dark mode, where t1 is the light ink).
  const passed = label === '합격'
  const bg = passed ? c.t1 : c.fill
  const fg = passed ? c.bg : c.t2
  return (
    <View style={{ minWidth, minHeight: 22, paddingHorizontal: 7, borderRadius: radius.xs, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {glyph ? (
          <Text v="c2" weight="800" style={{ color: fg, marginRight: glyph.gap }}>
            {glyph.char}
          </Text>
        ) : null}
        <Text v="c2" weight="700" style={{ color: fg }} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  )
}

export default Badge
