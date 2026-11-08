import { Platform, StyleSheet, Text as RNText, type TextProps } from 'react-native'
import { fontFor, type, useColors, type Colors, type TypeName } from '../../theme'

// RN 0.88 TextMeasurementRounding.h:36-39 adds 0.001 before ceiling to the pixel grid (react-native#53450), so a line height already on
// the grid grows one physical pixel per Text; list rows of 3 Text nodes ran +1pt. A hair under the line height keeps the box on it.
const LINE_EPSILON = Platform.OS === 'ios' ? 0.01 : 0

type Props = TextProps & {
  v?: TypeName
  color?: keyof Colors
  weight?: '400' | '500' | '600' | '700' | '800'
}

const Text = ({ v = 'b2', color = 't1', weight, style, ...rest }: Props) => {
  const c = useColors()
  const t = type[v]
  const lineHeight = StyleSheet.flatten(style)?.lineHeight ?? t.lineHeight
  return (
    <RNText
      {...rest}
      style={[
        { fontSize: t.fontSize, letterSpacing: t.letterSpacing, color: c[color] },
        fontFor(weight ?? t.weight),
        style,
        { lineHeight: lineHeight - LINE_EPSILON },
      ]}
    />
  )
}

export default Text
