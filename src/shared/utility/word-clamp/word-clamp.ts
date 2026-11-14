const WORD_JOINER = /⁠/g

/**
 * The lines the boards' `-webkit-line-clamp` keeps: the first `count` laid-out lines, whole, so the cut falls on a word.
 * Native tail truncation fills the last line with the rest of the text and cuts it by character. Null when every line fits.
 */
export const clampLines = (laidOut: string[], count: number) =>
  laidOut.length <= count ? null : laidOut.slice(0, count).map((line) => line.replace(WORD_JOINER, '').replace(/\n$/, ''))
