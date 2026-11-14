import type { ReactNode } from 'react'
import { Platform, StyleSheet, Text as RNText, type TextProps } from 'react-native'
import { fontFor, type, useColors, type Colors, type TypeName } from '../../theme'

// RN 0.88 TextMeasurementRounding.h:36-39 adds 0.001 before ceiling to the pixel grid (react-native#53450), so a line height already on
// the grid grows one physical pixel per Text; list rows of 3 Text nodes ran +1pt. A hair under the line height keeps the box on it.
const LINE_EPSILON = Platform.OS === 'ios' ? 0.01 : 0

// The boards are drawn by the device's WebKit, which lays 12-15px text narrower than CoreText by 1.0% (12px) down to 0.2% (15px) and 0 from
// 16px (97 board runs: mean |CT - board| 0.20 pt, worst +0.59 pt over). Removing 0.0015em x (16 - size) per glyph brings the worst overshoot to
// +0.06 pt, so a line that fits on the board (a 362 pt profile intro at 361.7) fits on the device too instead of dropping its last word.
const BOARD_TRACK_EM = Platform.OS === 'ios' ? 0.0015 : 0
export const boardTracking = (fontSize: number) => (fontSize < 16 ? -BOARD_TRACK_EM * (16 - fontSize) * fontSize : 0)

// Rule 5: a word the boards keep whole (WebKit keep-all) is not broken at its middle dot or its brackets. TextKit breaks between a Hangul
// syllable and "(" and after a middle dot, so a line could start with "·정산". A word joiner (U+2060) forbids the break at those spots only.
const WJ = '\u2060'
export const keepWordsWhole = (s: string) =>
  s.replace(/(\S)\(/g, `$1${WJ}(`).replace(/\)(\S)/g, `)${WJ}$1`).replace(/([^\s·\u2060])·(?=[^\s·])/g, `$1${WJ}·${WJ}`)

/** Joins only flat strings and numbers: Maestro and VoiceOver read the original through `label`; a nested Text keeps its text as written. */
export const joinWords = (children: ReactNode): { children: ReactNode; label?: string } => {
  const parts = Array.isArray(children) ? children : [children]
  if (Platform.OS !== 'ios' || !parts.every((n) => typeof n === 'string' || typeof n === 'number')) return { children }
  const joined = parts.map((n) => (typeof n === 'string' ? keepWordsWhole(n) : n))
  return joined.some((n, i) => n !== parts[i]) ? { children: joined, label: parts.join('') } : { children }
}

type Props = TextProps & {
  v?: TypeName
  color?: keyof Colors
  weight?: '400' | '500' | '600' | '700' | '800'
}

const Text = ({ v = 'b2', color = 't1', weight, style, children, ...rest }: Props) => {
  const c = useColors()
  const t = type[v]
  const flat = StyleSheet.flatten(style)
  const lineHeight = flat?.lineHeight ?? t.lineHeight
  // The boards track -0.02em of the size actually drawn, so a style that sets fontSize scales the token's tracking with it.
  const fontSize = flat?.fontSize ?? t.fontSize
  const letterSpacing = (t.letterSpacing / t.fontSize) * fontSize + boardTracking(fontSize)
  const { children: joined, label } = joinWords(children)
  return (
    <RNText
      // Rule 5: Korean breaks between words, never inside one, so no syllable is left alone on a line (supersedes DESIGN-GAPS G29).
      // Android has no word-keep option in RN; its default break already falls on the space.
      lineBreakStrategyIOS="hangul-word"
      {...rest}
      accessibilityLabel={rest.accessibilityLabel ?? label}
      style={[{ fontSize: t.fontSize, letterSpacing, color: c[color] }, fontFor(weight ?? t.weight), style, { lineHeight: lineHeight - LINE_EPSILON }]}
    >
      {joined}
    </RNText>
  )
}

export default Text
