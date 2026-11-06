import { type } from '../../theme/tokens'

const MULTILINE_ROWS = 4

/** Multiline keeps the 24 line-height token and grows by rows; single line drops it (Android clipped glyphs at 1.3) and only scales its floor. */
export const inputMetrics = (multiline: boolean | undefined, fontScale: number) =>
  multiline
    ? { lineHeight: type.b1.lineHeight, minHeight: MULTILINE_ROWS * type.b1.lineHeight * fontScale }
    : { minHeight: type.b1.lineHeight * fontScale }
