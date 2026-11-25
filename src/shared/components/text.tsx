import type { ReactNode } from 'react'
import { Platform, StyleSheet, Text as RNText, type TextProps } from 'react-native'
import { fontFor, type, useColors, type Colors, type TypeName } from '../../theme'
import { keepWordsWhole } from '../utility/keep-words'

const LINE_EPSILON = Platform.OS === 'ios' ? 0.01 : 0

const BOARD_TRACK_EM = Platform.OS === 'ios' ? 0.0015 : 0
export const boardTracking = (fontSize: number) => (fontSize < 16 ? -BOARD_TRACK_EM * (16 - fontSize) * fontSize : 0)

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
  const fontSize = flat?.fontSize ?? t.fontSize
  const letterSpacing = (t.letterSpacing / t.fontSize) * fontSize + boardTracking(fontSize)
  const { children: joined, label } = joinWords(children)
  return (
    <RNText
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
