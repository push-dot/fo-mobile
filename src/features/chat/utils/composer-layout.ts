export type ComposerLayout = { box: boolean; wrapLength: number }

export const COMPOSER_ROW: ComposerLayout = { box: false, wrapLength: 0 }

export const settleComposerLayout = (prev: ComposerLayout, lines: number, length: number): ComposerLayout => {
  if (length === 0) return prev.box ? COMPOSER_ROW : prev
  if (!prev.box) return lines > 1 ? { box: true, wrapLength: length } : prev
  return lines <= 1 && length < prev.wrapLength ? COMPOSER_ROW : prev
}
