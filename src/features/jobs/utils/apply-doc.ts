import type { SourceItem } from '@push/api-client'
import { APPLY_DOC_NOTE } from '../constants'
import type { ApplyDoc } from '../types'

const day = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export const applyDoc = (s: SourceItem): ApplyDoc => {
  const ai = s.origin === 'AI'
  const label = ai ? APPLY_DOC_NOTE.ai : APPLY_DOC_NOTE.upload
  return { id: s.id, name: s.fileName, ai, note: s.createdAt ? `${label} · ${day(s.createdAt)}` : label }
}
