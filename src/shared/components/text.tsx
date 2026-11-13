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
  const flat = StyleSheet.flatten(style)
  const lineHeight = flat?.lineHeight ?? t.lineHeight
  // The boards track -0.02em of the size actually drawn, so a style that sets fontSize scales the token's tracking with it.
  const fontSize = flat?.fontSize ?? t.fontSize
  const letterSpacing = (t.letterSpacing / t.fontSize) * fontSize
  return (
    <RNText
      // Rule 5: Korean breaks between words, never inside one, so no syllable is left alone on a line (supersedes DESIGN-GAPS G29).
      // Android has no word-keep option in RN; its default break already falls on the space.
      lineBreakStrategyIOS="hangul-word"
      {...rest}
      style={[{ fontSize: t.fontSize, letterSpacing, color: c[color] }, fontFor(weight ?? t.weight), style, { lineHeight: lineHeight - LINE_EPSILON }]}
    />
  )
}

export default Text
