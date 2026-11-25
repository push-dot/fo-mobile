import { Platform } from 'react-native'
import { type } from '../../theme/tokens'

const MULTILINE_ROWS = 4

export const inputReset = Platform.OS === 'android' ? ({ padding: 0, includeFontPadding: false } as const) : {}

export const inputMetrics = (multiline: boolean | undefined, fontScale: number) =>
  multiline
    ? { ...inputReset, lineHeight: type.b1.lineHeight, minHeight: MULTILINE_ROWS * type.b1.lineHeight * fontScale }
    : { ...inputReset, minHeight: type.b1.lineHeight * fontScale }

const FONT_LINE_EM = 1.448

export const iosLineBox = (lineHeight: number, fontSize: number, fontScale: number, os: string = Platform.OS) => {
  if (os !== 'ios') return undefined
  const lead = (Math.max(0, lineHeight - fontSize * FONT_LINE_EM) / 2) * fontScale
  return { paddingTop: 0, marginTop: -lead, marginBottom: lead }
}
