import { View } from 'react-native'
import { Text } from '@/shared/components'
import { onAccent, useColors } from '../../../theme'

// The quick-start boards draw each logo size with its own corner and glyph size, not one ratio.
const LOGO_SHAPE: Record<number, { radius: number; font: number }> = {
  34: { radius: 11, font: 14 },
  40: { radius: 13, font: 15 },
  44: { radius: 14, font: 17 },
}

/** `round` is a person's avatar: the dark chip every other avatar draws (owner rule 3: no tint where black will do), not the brand colour. */
const Mark = ({ text, color, size = 44, round }: { text: string; color: string; size?: number; round?: boolean }) => {
  const c = useColors()
  const shape = round ? undefined : LOGO_SHAPE[size]
  return (
    <View
      style={{ width: size, height: size, borderRadius: round ? size / 2 : (shape?.radius ?? Math.round(size * 0.31)), backgroundColor: round ? c.t1 : color, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text weight={round ? '700' : '800'} style={{ color: round ? c.bg : onAccent, fontSize: round ? size * 0.32 : (shape?.font ?? size * 0.38), lineHeight: size * 0.5 }}>
        {text}
      </Text>
    </View>
  )
}

export default Mark
