import type { SourceItem } from '@push/api-client'
import { APPLY_DOC_NOTE } from '../constants'
import type { ApplyDoc } from '../types'

const day = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

const sameDay = (iso: string, now: Date) => {
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export const applyDoc = (s: SourceItem, now = new Date()): ApplyDoc => {
  const ai = s.origin === 'AI'
  const label = ai ? APPLY_DOC_NOTE.ai : APPLY_DOC_NOTE.upload
  if (!s.createdAt) return { id: s.id, name: s.fileName, ai, note: label }
  const when = sameDay(s.createdAt, now) ? '오늘' : day(s.createdAt)
  return { id: s.id, name: s.fileName, ai, note: `${label} · ${when}` }
}
