/** The boards clamp with `-webkit-line-clamp`: line `max` stays as it wraps, and the ellipsis follows its last word. Native tail truncation cuts inside a word instead. */
export const clampByWords = (lines: readonly string[], max: number, dropped: number) => {
  if (lines.length <= max) return lines.join('')
  const words = lines[max - 1].trimEnd().split(' ')
  return `${lines.slice(0, max - 1).join('')}${words.slice(0, Math.max(1, words.length - dropped)).join(' ')}…`
}
