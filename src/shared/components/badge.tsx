import { View } from 'react-native'
import { radius, useColors } from '../../theme'
import Text from './text'

export type BadgeTone = 'ac' | 'grey' | 'red' | 'green' | 'orange'

export type BadgeGlyph = { char: string; gap: number }

const Badge = ({ label, minWidth, glyph }: { label: string; tone?: BadgeTone; minWidth?: number; glyph?: BadgeGlyph }) => {
  const c = useColors()
  const passed = label === '합격' || label === '수락함'
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
