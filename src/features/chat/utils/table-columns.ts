import { textWidth } from '@/shared/utility/text-width'

/** The boards' `.mdt`: cells pad 6 14 6 0 (the last column 0), a body cell is 14 over 20, a head cell 13 semibold over 20, and the table fills the bubble. */
export const CELL = { padRight: 14, padY: 6, line: 20, body: 14, head: 13 }

const TRACKING = -0.02

const cellWidth = (text: string, head: boolean) => textWidth(text, head ? CELL.head : CELL.body, head ? 'semibold' : 'regular', TRACKING * (head ? CELL.head : CELL.body))
const longestWord = (text: string) => text.split(/\s+/).reduce((a, b) => (cellWidth(b, false) > cellWidth(a, false) ? b : a), '')

/** The right padding of a cell: every column but the last. */
export const cellPadRight = (col: number, columns: number) => (col === columns - 1 ? 0 : CELL.padRight)

/**
 * The column widths of an auto-layout table `avail` wide, as the boards' WebKit draws it: a column is as wide as its widest cell on one line when the table has room (the last column takes
 * the rest); otherwise the columns shrink in proportion to those widths, none below its longest word. Widths include the right padding every cell but the last column's has.
 */
export const tableColumns = (head: readonly string[], rows: readonly (readonly string[])[], avail: number) => {
  const cells = (col: number) => [{ text: head[col] ?? '', head: true }, ...rows.map((row) => ({ text: row[col] ?? '', head: false }))]
  const padOf = (col: number) => cellPadRight(col, head.length)
  const maxs = head.map((_, col) => Math.max(...cells(col).map((c) => cellWidth(c.text, c.head))) + padOf(col))
  const mins = head.map((_, col) => Math.max(...cells(col).map((c) => (c.head ? cellWidth(c.text, true) : cellWidth(longestWord(c.text), false)))) + padOf(col))
  const total = maxs.reduce((a, b) => a + b, 0)
  if (total <= avail) return maxs.map((w, i) => (i === maxs.length - 1 ? w + avail - total : w))
  const widths = [...maxs]
  let free = maxs.map((_, i) => i)
  let room = avail
  while (free.length) {
    const sum = free.reduce((a, i) => a + maxs[i]!, 0)
    const clamped = free.filter((i) => (room * maxs[i]!) / sum < mins[i]!)
    if (!clamped.length) {
      for (const i of free) widths[i] = (room * maxs[i]!) / sum
      break
    }
    for (const i of clamped) {
      widths[i] = mins[i]!
      room -= mins[i]!
    }
    free = free.filter((i) => !clamped.includes(i))
  }
  return widths
}
