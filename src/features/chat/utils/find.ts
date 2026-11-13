import type { BotContract } from '@push/api-client'
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

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export type Mark = { text: string; hit: boolean }

export const splitMarks = (text: string, query: string): Mark[] => {
  const q = query.trim()
  if (!q) return [{ text, hit: false }]
  return text
    .split(new RegExp(`(${escapeRegExp(q)})`, 'gi'))
    .map((part, i) => ({ text: part, hit: i % 2 === 1 }))
    .filter((mark) => mark.text !== '')
}
