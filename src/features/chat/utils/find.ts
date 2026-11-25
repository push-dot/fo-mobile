import type { BotContract } from '@push/api-client'
import { WORD_JOINER } from '@/shared/utility/keep-words'
import type { ChatItem } from '../types'

export type FindStep = 'older' | 'newer'

export const stepMatch = (index: number, total: number, step: FindStep) => {
  if (total === 0) return 0
  return (index + (step === 'older' ? 1 : -1) + total) % total
}

export const matchLabel = (index: number, total: number) => (total === 0 ? '' : `${index + 1}/${total}`)

export const matchItemId = (match: BotContract.TranscriptMatch, items: readonly ChatItem[]) =>
  items.find((item) => item.id === match.messageId || (item.type === 'agentText' && item.id.startsWith(`${match.turnId}:`)))?.id

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

export const fromFirst = (items: readonly ChatItem[], type: ChatItem['type'], nth: number | 'last' = 1) => {
  const at = items.flatMap((item, i) => (item.type === type ? [i] : []))
  return items.slice((nth === 'last' ? at.at(-1) : at[nth - 1]) ?? 0)
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wordJoinerTolerant = (q: string) => [...q].map(escapeRegExp).join(`${WORD_JOINER}*`)

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

export const hitCount = (text: string, query: string) => splitMarks(text, query).filter((mark) => mark.hit).length

export const hitsBefore = (lines: readonly string[], query: string) => lines.map((_, i) => lines.slice(0, i).reduce((sum, line) => sum + hitCount(line, query), 0))

export type TextLine = { x: number; y: number; width: number; height: number; ascender: number }
export type Point = { x: number; y: number }
export type MarkEdges = { left: Point; right: Point }

const ASCENT_EM = 1.16
const DESCENT_EM = 0.288
export const MARK_RADIUS = 4

const lineAt = (lines: readonly TextLine[], y: number) => lines.find((line) => y >= line.y - 0.5 && y <= line.y + line.height + 0.5)

export const markRects = (lines: readonly TextLine[], { left, right }: MarkEdges, fontSize: number) => {
  const first = lineAt(lines, left.y)
  const last = lineAt(lines, right.y)
  if (!first || !last) return []
  const box = (line: TextLine, from: number, to: number) => ({ left: from, width: to - from, top: line.y + line.ascender - ASCENT_EM * fontSize, height: (ASCENT_EM + DESCENT_EM) * fontSize })
  if (first === last) return [box(first, left.x, right.x)]
  const between = lines.slice(lines.indexOf(first) + 1, lines.indexOf(last))
  return [box(first, left.x, first.x + first.width), ...between.map((line) => box(line, line.x, line.x + line.width)), box(last, last.x, right.x)]
}
