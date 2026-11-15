const WORD_JOINER = /⁠/g

/**
 * The lines the boards' `-webkit-line-clamp` keeps: the first `count` laid-out lines, whole, so the cut falls on a word.
 * Native tail truncation fills the last line with the rest of the text and cuts it by character. Null when every line fits.
 */
export const clampLines = (laidOut: string[], count: number) =>
  laidOut.length <= count ? null : laidOut.slice(0, count).map((line) => line.replace(WORD_JOINER, '').replace(/\n$/, ''))

/** `line` with its trailing words dropped one at a time, each followed by the dots: the candidates for a last line that has no room left for them. */
export const dotted = (line: string) => {
  const words = line.trimEnd().split(' ')
  return words.map((_, i) => `${words.slice(0, i + 1).join(' ')}…`)
}

/** The longest candidate whose measured width fits `limit` (the first one when none does). */
export const longestFit = (candidates: string[], widths: number[], limit: number) =>
  candidates.findLast((_, i) => (widths[i] ?? Infinity) <= limit) ?? candidates[0]!
