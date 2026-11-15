import type { ChatItem } from '../types'

type Fit = Extract<ChatItem, { type: 'fit' }>
type Diff = Extract<ChatItem, { type: 'diff' }>
type Todo = Extract<ChatItem, { type: 'todo' }>

export type DetailText = { text: string; detail?: { text: string; more: string }; list?: string[] }

const score = (n: number) => n.toFixed(1)

// A decimal's last digit says 영, 삼 or 육 with a final consonant: 으로; the others end open or in ㄹ: 로.
const roForNumber = (text: string) => ('036'.includes(text.at(-1)!) ? '으로' : '로')

/** The result of 점수 올리기: the score line, then what each round raised as a marked list (ChatPh3Boost). */
const boostBubble = (item: Fit & { from: number }): DetailText => {
  const to = score(item.score)
  const text = `적합도를 ${score(item.from)} → ${to}${roForNumber(to)} 올렸어요. (${item.delta ?? `+${(item.score - item.from).toFixed(1)}`})`
  const rounds = item.rounds ?? []
  return rounds.length ? { text, list: rounds.map((r) => `${r.label}: ${r.line.split(' · ').slice(1).join(' · ')}`) } : { text }
}

/** The fit card as a bubble line (rule 30): the sentence or the numbers in the bubble, the parts as grey sub-text that a tap opens. */
export const fitBubble = (item: Fit): DetailText => {
  if (item.note && item.from !== undefined) return boostBubble({ ...item, from: item.from })
  const rows = (item.rows ?? []).map((r) => `${r.label} ${score(r.score)}`)
  if (item.from === undefined) {
    const text = `적합도는 ${score(item.score)}점이에요.${item.caption ? ` ${item.caption}` : ''}`
    return rows.length ? { text, detail: { text: '항목별 점수 보기 ›', more: rows.join(' · ') } } : { text }
  }
  const text = [`적합도 **${score(item.from)} → ${score(item.score)}**`, item.delta ?? item.caption].filter(Boolean).join(' · ')
  const keywords = (item.keywords ?? []).map((k) => `${k.ok ? '✓' : '✗'} ${k.label}`)
  const lines = [...rows, ...(keywords.length ? [keywords.join('  ')] : [])]
  return lines.length ? { text, detail: { text: [...rows, ...keywords].join(' · '), more: lines.join('\n') } } : { text }
}

const SIGN = { '+': '+', '-': '−', '~': '~', '': ' ' } as const

/** The edit under a bot line: the number of changed lines to open, every line when opened (ChatApprove "바뀐 내용 3줄 보기 ›"). */
export const diffLinesDetail = (lines: Diff['lines']) => ({
  text: `바뀐 내용 ${lines.filter((l) => l.sign !== '').length}줄 보기 ›`,
  more: lines.map((l) => `${SIGN[l.sign]} ${l.text}`).join('\n'),
})

/** A document edit as a bubble line: the count of changed lines, the lines themselves as grey sub-text. */
export const diffBubble = (item: Diff): DetailText => {
  const added = item.lines.filter((l) => l.sign === '+').length
  const removed = item.lines.filter((l) => l.sign === '-').length
  return {
    text: '수정안이에요',
    detail: { text: `+${added}줄 · −${removed}줄`, more: diffLinesDetail(item.lines).more },
  }
}

export const todoLines = (item: Todo) => item.items.map((i) => ({ text: `${i.label}${i.added ? ' (새로 추가)' : ''}`, state: i.state }))
