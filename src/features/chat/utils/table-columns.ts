import { textWidth } from '@/shared/utility/text-width'

export const CELL = { padRight: 14, padY: 6, line: 20, body: 14, head: 13 }

const TRACKING = -0.02

const cellWidth = (text: string, head: boolean) => textWidth(text, head ? CELL.head : CELL.body, head ? 'semibold' : 'regular', TRACKING * (head ? CELL.head : CELL.body))
const longestWord = (text: string) => text.split(/\s+/).reduce((a, b) => (cellWidth(b, false) > cellWidth(a, false) ? b : a), '')

export const cellPadRight = (col: number, columns: number) => (col === columns - 1 ? 0 : CELL.padRight)

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
