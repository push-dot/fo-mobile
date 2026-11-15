import type { BotContract } from '@push/api-client'
import { WORD_JOINER } from '@/shared/utility/keep-words'
import type { ChatItem } from '../types'

export type FindStep = 'older' | 'newer'

/** Matches arrive newest first, so index 0 is the newest. Stepping wraps. */
export const stepMatch = (index: number, total: number, step: FindStep) => {
  if (total === 0) return 0
  return (index + (step === 'older' ? 1 : -1) + total) % total
}

export const matchLabel = (index: number, total: number) => (total === 0 ? '' : `${index + 1}/${total}`)

/** A user line is stored under its message id. A bot line is stored under `${turnId}:${seq}`, so the turn finds it. */
export const matchItemId = (match: BotContract.TranscriptMatch, items: readonly ChatItem[]) =>
  items.find((item) => item.id === match.messageId || (item.type === 'agentText' && item.id.startsWith(`${match.turnId}:`)))?.id

/** Pages older turns in until the match's line is on screen. Undefined when the whole history holds no line for it. */
export const revealMatch = async (
  match: BotContract.TranscriptMatch,
  thread: { items: () => readonly ChatItem[]; hasOlder: () => boolean; loadOlder: () => Promise<unknown> },
) => {
  for (;;) {
    const id = matchItemId(match, thread.items())
    if (id) return id
    if (!thread.hasOlder()) return undefined
    await thread.loadOlder()
  }
}

/** A restored page numbers its own lines (`tool-3`), so a collision with a line already shown gets a prefix. */
export const prependOlder = (current: readonly ChatItem[], older: readonly ChatItem[]) => {
  const taken = new Set(current.map((item) => item.id))
  const fresh = older.map((item) => {
    let id = item.id
    while (taken.has(id)) id = `older-${id}`
    taken.add(id)
    return id === item.id ? item : { ...item, id }
  })
  return [...fresh, ...current]
}

/** The thread from its first line of `type`: what came before counts as older turns. */
export const fromFirst = (items: readonly ChatItem[], type: ChatItem['type']) => items.slice(Math.max(0, items.findIndex((item) => item.type === type)))

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// The text component joins words with U+2060; a query typed without it still finds the word.
const wordJoinerTolerant = (q: string) => [...q].map(escapeRegExp).join(`${WORD_JOINER}*`)

/**
 * Which hit of the matched message the match at `index` is, in reading order. A message with n hits comes n times, newest hit (the last in reading order) first,
 * so the first of its entries is the last hit. Counted over the whole list, a source-title hit follows the text's hits in reading order.
 */
export const hitOf = (matches: readonly BotContract.TranscriptMatch[], index: number) => {
  const id = matches[index]?.messageId
  const total = matches.filter((m) => m.messageId === id).length
  const rank = matches.slice(0, index).filter((m) => m.messageId === id).length
  return total - 1 - rank
}

export type Mark = { text: string; hit: boolean }

export const splitMarks = (text: string, query: string): Mark[] => {
  const q = query.trim()
  if (!q) return [{ text, hit: false }]
  return text
    .split(new RegExp(`(${wordJoinerTolerant(q)})`, 'gi'))
    .map((part, i) => ({ text: part, hit: i % 2 === 1 }))
    .filter((mark) => mark.text !== '')
}

/** How many hits the query has in `text`. */
export const hitCount = (text: string, query: string) => splitMarks(text, query).filter((mark) => mark.hit).length

/** `hitsBefore[i]` is how many hits the lines above line i hold. */
export const hitsBefore = (lines: readonly string[], query: string) => lines.map((_, i) => lines.slice(0, i).reduce((sum, line) => sum + hitCount(line, query), 0))

/** One line of a Text's onTextLayout; `ascender` is the baseline's distance below the line's top. */
export type TextLine = { x: number; y: number; width: number; height: number; ascender: number }
export type Point = { x: number; y: number }
export type MarkEdges = { left: Point; right: Point }

// The boards draw `mark` over its inline box, the font's content area: Noto Sans KR hhea ascent 1.16 em, descent 0.288 em.
const ASCENT_EM = 1.16
const DESCENT_EM = 0.288
export const MARK_RADIUS = 4

const lineAt = (lines: readonly TextLine[], y: number) => lines.find((line) => y >= line.y - 0.5 && y <= line.y + line.height + 0.5)

/** The boxes behind a mark: one per line it spans, from the position of its two edges in the paragraph. */
export const markRects = (lines: readonly TextLine[], { left, right }: MarkEdges, fontSize: number) => {
  const first = lineAt(lines, left.y)
  const last = lineAt(lines, right.y)
  if (!first || !last) return []
  const box = (line: TextLine, from: number, to: number) => ({ left: from, width: to - from, top: line.y + line.ascender - ASCENT_EM * fontSize, height: (ASCENT_EM + DESCENT_EM) * fontSize })
  if (first === last) return [box(first, left.x, right.x)]
  const between = lines.slice(lines.indexOf(first) + 1, lines.indexOf(last))
  return [box(first, left.x, first.x + first.width), ...between.map((line) => box(line, line.x, line.x + line.width)), box(last, last.x, right.x)]
}
