import type { SourceItem } from '@push/api-client'
import { APPLY_DOC_NOTE } from '../constants'
import type { ApplyBody, ApplyDoc } from '../types'

export const monthDay = (iso: string) => {
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
  const date = s.createdAt
  const note = !date ? label : `${label} · ${sameDay(date, now) ? '오늘' : monthDay(date)}`
  return { id: s.id, name: s.fileName, ai, note, kind: s.kind ?? null, date }
}

export const splitApplyDocs = (docs: ApplyDoc[]) => ({
  main: docs.filter((d) => d.kind !== 'PORTFOLIO'),
  extras: docs.filter((d) => d.kind === 'PORTFOLIO'),
})

export const applyBody = (main: ApplyDoc | undefined, extras: ApplyDoc[]): ApplyBody => {
  const docs = [main, ...extras].filter((d): d is ApplyDoc => !!d)
  return {
    documentIds: docs.filter((d) => d.ai).map((d) => d.id),
    sourceIds: docs.filter((d) => !d.ai).map((d) => d.id),
  }
}

export const extraNote = (d: ApplyDoc) => `함께 보낼 수 있어요${d.date ? ` · ${monthDay(d.date)}` : ''}`
