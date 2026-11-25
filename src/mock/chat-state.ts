import type { A2uiFrame } from '@push/api-client'
import type { ChatDoc } from '@/features/chat'
import { RESUME } from './bot-scripts/runs'

export const consent = { referenceData: false }

export const grantReference = () => {
  consent.referenceData = true
}

export const hasReferenceConsent = () => consent.referenceData

export const scenario = new Map<string, { prefix: string; labels: string[]; verified?: boolean }>()

export const waiting = new Map<string, A2uiFrame>()

export const forgetRun = (id: string) => {
  waiting.delete(id)
  scenario.delete(id)
}

export const docs: ChatDoc[] = [
  { id: 'd1', fileName: RESUME, size: 2_400_000, createdAt: '2026-10-12T09:00:00+09:00' },
  { id: 'd2', fileName: '경력기술서_모아페이.docx', size: 640_000, createdAt: '2026-09-28T09:00:00+09:00' },
  { id: 'd3', fileName: '포트폴리오_결제시스템.pdf', size: 8_100_000, createdAt: '2026-08-03T09:00:00+09:00' },
  { id: 'd4', fileName: '모아페이_맞춤_이력서_v2.pdf', size: 186_000, createdAt: new Date(Date.now() - 10 * 60_000).toISOString(), aiMade: true },
]
export const removeChatDoc = (id: string) => {
  const i = docs.findIndex((d) => d.id === id)
  if (i >= 0) docs.splice(i, 1)
}
