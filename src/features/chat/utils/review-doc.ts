import type { DiffLine } from '../types'

export type ReviewKind = 'title' | 'headline' | 'section' | 'role' | 'text'
export type ReviewPart = { text: string; strong?: boolean }
export type ReviewRow = { kind: ReviewKind; sign: '' | '+' | '-'; parts: ReviewPart[]; date?: string }

export const REVIEW_TITLE = 'Push 프로필'

const UNIT = '(?:ms|%|배|건|명|원|초|분|시간|개월|일|년|회|만|억)'
const NUM = `\\d[\\d,.]*\\s?${UNIT}?`
const CHANGED_NUMBER = new RegExp(`${NUM}(?:\\s?→\\s?${NUM})?`, 'g')
const DATE_RANGE = /^(.*?)[\s·|]*(\d{4}\.\d{2}\s*[–-]\s*(?:현재|\d{4}\.\d{2}))$/

const WORD = /[^\s·]+/g

const lcsLength = (a: string[], b: string[]) => {
  const row = new Array<number>(b.length + 1).fill(0)
  for (const x of a) {
    let diag = 0
    for (let j = 1; j <= b.length; j++) {
      const up = row[j]!
      row[j] = x === b[j - 1] ? diag + 1 : Math.max(up, row[j - 1]!)
      diag = up
    }
  }
  return row[b.length]!
}

/** Words the edit kept but moved: in both lines, outside the longest common run, in a line that is mostly the old one reordered (Java · Spring Boot · MySQL · Kafka → Kafka · Kotlin · Spring Boot · MySQL). */
const movedWords = (text: string, before: string) => {
  const now: string[] = text.match(WORD) ?? []
  const old: string[] = before.match(WORD) ?? []
  const common = lcsLength(old, now)
  if (common * 2 < Math.min(now.length, old.length)) return new Set<string>()
  return new Set(now.filter((w) => old.includes(w) && lcsLength(old.filter((o) => o !== w), now.filter((n) => n !== w)) === common))
}

/** What the edit changed in a line, against the removed text it replaces: a number that is new or moved (320ms → 140ms, 99.98%) and a word that moved (Kafka). With nothing removed before it, nothing is bold. */
export const strongParts = (text: string, before?: string): ReviewPart[] => {
  if (!before) return [{ text }]
  const marks: { start: number; end: number }[] = []
  for (const m of text.matchAll(CHANGED_NUMBER)) {
    const shown = m[0].trimEnd()
    const prev = text[m.index - 1]
    const moved = shown.includes('→') || new RegExp(`${UNIT}$`).test(shown)
    if (moved && !(prev && /[A-Za-z0-9.]/.test(prev)) && !before.includes(shown)) marks.push({ start: m.index, end: m.index + shown.length })
  }
  const moved = movedWords(text, before)
  for (const m of text.matchAll(WORD)) if (moved.has(m[0])) marks.push({ start: m.index, end: m.index + m[0].length })
  marks.sort((x, y) => x.start - y.start)
  const parts: ReviewPart[] = []
  let at = 0
  for (const { start, end } of marks) {
    if (start < at) continue
    if (start > at) parts.push({ text: text.slice(at, start) })
    parts.push({ text: text.slice(start, end), strong: true })
    at = end
  }
  if (at < text.length) parts.push({ text: text.slice(at) })
  return parts.length ? parts : [{ text }]
}

/** The document is markdown lines: "# name", "## section", "- bullet". A diff line may hold several lines (before/after are sent as one block). */
export const reviewRows = (lines: readonly DiffLine[]): ReviewRow[] => {
  const rows: ReviewRow[] = []
  for (const line of lines) {
    const sign = line.sign === '~' ? '+' : line.sign
    for (const raw of line.text.split('\n')) {
      const trimmed = raw.trim()
      if (!trimmed) continue
      const text = trimmed.replace(/\*\*/g, '')
      const prev = rows.at(-1)
      if (text.startsWith('## ')) rows.push({ kind: 'section', sign, parts: [{ text: text.slice(3).trim() }] })
      else if (text.startsWith('# ')) rows.push({ kind: 'title', sign, parts: [{ text: text.slice(2).trim() }] })
      else {
        const body = text.replace(/^[-•]\s+/, '')
        const role = DATE_RANGE.exec(body)
        if (role?.[1]) rows.push({ kind: 'role', sign, parts: [{ text: role[1] }], date: role[2] })
        else if (prev?.kind === 'title' && sign === '') rows.push({ kind: 'headline', sign, parts: [{ text: body }] })
        else rows.push({ kind: 'text', sign, parts: [{ text: body }] })
      }
    }
  }
  return rows.map((row, i) => (row.kind === 'text' && row.sign === '+' ? { ...row, parts: strongParts(row.parts[0]!.text, removedBefore(rows, i)) } : row))
}

const removedBefore = (rows: ReviewRow[], i: number) => {
  let at = i
  while (at > 0 && rows[at - 1]!.sign === '+') at--
  const removed: string[] = []
  while (at > 0 && rows[at - 1]!.sign === '-') removed.unshift(rows[--at]!.parts.map((p) => p.text).join(''))
  return removed.join(' ')
}

