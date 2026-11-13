import type { SourceItem } from '@push/api-client'
import type { ApplyBody, ApplyDoc } from '../types'

export const monthDay = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export const applyDoc = (s: SourceItem): ApplyDoc => {
  const ai = s.origin === 'AI'
  const date = s.createdAt
  // The sheet shows the date only; how a document was made is not told here.
  return { id: s.id, name: s.fileName, ai, note: date ? monthDay(date) : '', kind: s.kind ?? null, date }
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

export const extraNote = (d: ApplyDoc) => (d.date ? monthDay(d.date) : '')
