export type ComposerLayout = { box: boolean; switchedAt: number }

export const COMPOSER_ROW: ComposerLayout = { box: false, switchedAt: 0 }

/**
 * Pill or box. The pill (one row: + text @ send) turns into a box (text on top, the buttons on their own row) once the text wraps.
 * The box is wider for the text, so a line that wrapped in the pill may fit on one line inside it. The box therefore goes back to the
 * pill only when the field is empty, or when it is one line again and shorter than the text that made it switch.
 */
export const settleComposerLayout = (prev: ComposerLayout, lines: number, length: number): ComposerLayout => {
  if (length === 0) return prev.box ? COMPOSER_ROW : prev
  if (!prev.box) return lines > 1 ? { box: true, switchedAt: length } : prev
  return lines <= 1 && length < prev.switchedAt ? COMPOSER_ROW : prev
}
