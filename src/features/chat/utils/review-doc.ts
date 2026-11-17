import type { ChatItem, DiffLine } from '../types'

export type ReviewKind = 'title' | 'headline' | 'section' | 'role' | 'text'
export type ReviewPart = { text: string; strong?: boolean }
export type ReviewRow = { kind: ReviewKind; sign: '' | '+' | '-'; parts: ReviewPart[]; date?: string }

export const REVIEW_TITLE = 'Push 프로필'

const UNIT = '(?:ms|%|배|건|명|원|초|분|시간|개월|일|년|회|만|억)'
const NUM = `\\d[\\d,.]*\\s?${UNIT}?`
const CHANGED_NUMBER = new RegExp(`${NUM}(?:\\s?→\\s?${NUM})?`, 'g')
const DATE_RANGE = /^(.*?)[\s·|]*(\d{4}\.\d{2}\s*[–-]\s*(?:현재|\d{4}\.\d{2}))$/

/** A number that moved (320ms → 140ms, 99.98%) is bold violet; digits inside a word (p95) and a plain count with no unit or arrow are not. */
export const strongParts = (text: string): ReviewPart[] => {
  const parts: ReviewPart[] = []
  let at = 0
  for (const m of text.matchAll(CHANGED_NUMBER)) {
    const start = m.index
    const prev = text[start - 1]
    const moved = m[0].includes('→') || new RegExp(`${UNIT}$`).test(m[0].trim())
    if (!moved || (prev && /[A-Za-z0-9.]/.test(prev))) continue
    if (start > at) parts.push({ text: text.slice(at, start) })
    parts.push({ text: m[0].trimEnd(), strong: true })
    at = start + m[0].trimEnd().length
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
        else rows.push({ kind: 'text', sign, parts: sign === '+' ? strongParts(body) : [{ text: body }] })
      }
    }
  }
  return rows
}

/** The changed lines of the edit the bot proposed since the person last spoke. */
export const latestDiffLines = (items: readonly ChatItem[]): DiffLine[] => {
  for (const item of [...items].reverse()) {
    if (item.type === 'user') return []
    const diff = item.type === 'diff' ? item : item.type === 'agentText' ? item.diff : undefined
    if (diff) return diff.lines
  }
  return []
}
