import type { ChatItem } from '../types'

type Fit = Extract<ChatItem, { type: 'fit' }>
type Diff = Extract<ChatItem, { type: 'diff' }>
type Todo = Extract<ChatItem, { type: 'todo' }>

export type DetailText = { text: string; detail?: { text: string; more: string } }

const score = (n: number) => n.toFixed(1)

/** The fit card as a bubble line (rule 30): the numbers in the bubble, the parts as grey sub-text that a tap opens. */
export const fitBubble = (item: Fit): DetailText => {
  const head = item.from === undefined ? `적합도 **${score(item.score)}** / 10` : `적합도 **${score(item.from)} → ${score(item.score)}**`
  const text = [head, item.delta ?? item.caption].filter(Boolean).join(' · ')
  const rows = (item.rows ?? []).map((r) => `${r.label} ${score(r.score)}`)
  const keywords = (item.keywords ?? []).map((k) => `${k.ok ? '✓' : '✗'} ${k.label}`)
  const lines = [...rows, ...(keywords.length ? [keywords.join('  ')] : [])]
  return lines.length ? { text, detail: { text: [...rows, ...keywords].join(' · '), more: lines.join('\n') } } : { text }
}

const SIGN = { '+': '+', '-': '−', '~': '~', '': ' ' } as const

/** A document edit as a bubble line: the count of changed lines, the lines themselves as grey sub-text. */
export const diffBubble = (item: Diff): DetailText => {
  const added = item.lines.filter((l) => l.sign === '+').length
  const removed = item.lines.filter((l) => l.sign === '-').length
  return {
    text: '수정안이에요',
    detail: { text: `+${added}줄 · −${removed}줄`, more: item.lines.map((l) => `${SIGN[l.sign]} ${l.text}`).join('\n') },
  }
}

/** The to-do list as a plain numbered list (ChatInterrupt): no checkboxes, a finished step is struck, the current one bold. */
export const todoLines = (item: Todo) =>
  item.items.map((i, n) => ({ text: `${n + 1}. ${i.label}${i.added ? ' · 새로 추가' : ''}`, state: i.state }))
