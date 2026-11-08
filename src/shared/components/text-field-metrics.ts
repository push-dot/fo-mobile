import { Platform } from 'react-native'
import { type } from '../../theme/tokens'

const MULTILINE_ROWS = 4

/** Android EditText adds theme and font padding where the style sets none (fields drew 64pt, placeholders clipped). */
export const inputReset = Platform.OS === 'android' ? ({ padding: 0, includeFontPadding: false } as const) : {}

/** Multiline keeps the 24 line-height token and grows by rows; single line drops it (Android clipped glyphs at 1.3) and only scales its floor. */
export const inputMetrics = (multiline: boolean | undefined, fontScale: number) =>
  multiline
    ? { ...inputReset, lineHeight: type.b1.lineHeight, minHeight: MULTILINE_ROWS * type.b1.lineHeight * fontScale }
    : { ...inputReset, minHeight: type.b1.lineHeight * fontScale }

// Noto Sans KR hhea ascender 1160 + descender 288 per 1000 units: UIFont.lineHeight (23.168 at 16pt) and the CSS content area.
const FONT_LINE_EM = 1.448

/**
 * iOS multiline. RN gives a multiline TextInput paddingTop 5 (TextInput.js `multilineDefault`), which becomes the UITextView's
 * textContainerInset, and TextKit puts a line's extra height above the glyphs where CSS splits it (half-leading).
 * Zero the inset and lift the view by the other half; device probe at line heights 24 and 25 put the first line on the CSS line box.
 */
export const iosLineBox = (lineHeight: number, fontSize: number, fontScale: number, os: string = Platform.OS) => {
  if (os !== 'ios') return undefined
  const lead = (Math.max(0, lineHeight - fontSize * FONT_LINE_EM) / 2) * fontScale
  return { paddingTop: 0, marginTop: -lead, marginBottom: lead }
}
