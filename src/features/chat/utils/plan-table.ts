import type { PlanItem } from '../types'
import type { TableBlock } from './bot-text'
import { isVerdictPlan } from './stream-v3'

const HEADS = {
  verdict: ['판정', '프로젝트', '근거'],
  feedback: ['구분', '고칠 점', '이렇게 고쳐요'],
  strategy: ['구분', '섹션', '할 일'],
} as const

/** A plan or feedback as the markdown table the bot's bubble draws (ChatPh1Feedback, ChatPh2, ChatPh2XBlueprints). */
export const planTable = (item: PlanItem): TableBlock => ({
  kind: 'table',
  head: [...HEADS[isVerdictPlan(item.rows) ? 'verdict' : item.id === 'feedback' ? 'feedback' : 'strategy']],
  rows: item.rows.map((r) => [r.tag, r.label, r.note]),
})

/** The keywords a strategy adds, as grey sub-text under its table. */
export const planKeywords = (item: PlanItem) => (item.keywords.length ? `넣을 키워드 ${item.keywords.join(' · ')}` : undefined)
