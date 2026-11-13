import { View } from 'react-native'
import { radius, useColors } from '../../theme'
import Text from './text'

export type BadgeTone = 'ac' | 'grey' | 'red' | 'green' | 'orange'

/** A bold lead glyph with its own right margin (the board's `.kw-ok:before` / `.kw-miss:before`). */
export type BadgeGlyph = { char: string; gap: number }

const Badge = ({ label, tone = 'grey', minWidth, glyph }: { label: string; tone?: BadgeTone; minWidth?: number; glyph?: BadgeGlyph }) => {
  const c = useColors()
  const map = {
    ac: [c.acSoft, c.acText],
    grey: [c.fill, c.t2],
    red: [c.redSoft, c.red],
    green: [c.greenSoft, c.green],
    orange: [c.orangeSoft, c.orange],
  } as const
  const [bg, fg] = map[tone]
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
