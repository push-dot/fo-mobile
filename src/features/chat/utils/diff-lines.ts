import type { StreamHunk } from '@push/api-client'
import type { ChatItem } from '../types'

type DiffLine = Extract<ChatItem, { type: 'diff' }>['lines'][number]

/**
 * push-be sends only '+' and '-' hunks. A line removed in one place and added back with the same text is a move,
 * which ChatPh3Review draws as one '~' line at the place it went to.
 */
export const diffLines = (hunks: StreamHunk[]): DiffLine[] => {
  const removedAt = new Map<number, number>()
  const used = new Set<number>()
  hunks.forEach((h, i) => {
    if (h.sign !== '+') return
    const from = hunks.findIndex((o, j) => o.sign === '-' && o.text === h.text && !used.has(j))
    if (from < 0) return
    used.add(from)
    removedAt.set(i, from)
  })
  return hunks.flatMap((h, i): DiffLine[] =>
    used.has(i) ? [] : [{ n: h.line ?? undefined, sign: removedAt.has(i) ? '~' : h.sign, text: h.text }],
  )
}
