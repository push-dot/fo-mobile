import { WORD_JOINER } from '../keep-words'

export const clampLines = (laidOut: string[], count: number) =>
  laidOut.length <= count ? null : laidOut.slice(0, count).map((line) => line.replaceAll(WORD_JOINER, '').replace(/\n$/, ''))

export const dotted = (line: string) => {
  const chars = Array.from(line.trimEnd())
  return chars.map((_, i) => `${chars.slice(0, i + 1).join('')}…`)
}

export const longestFit = (candidates: string[], widths: number[], limit: number) =>
  candidates.findLast((_, i) => (widths[i] ?? Infinity) <= limit) ?? candidates[0]!
