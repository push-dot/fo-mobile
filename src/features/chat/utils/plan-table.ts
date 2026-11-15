import type { PlanItem } from '../types'
import type { TableBlock } from './bot-text'
import { isVerdictPlan } from './stream-v3'

const HEADS = {
  feedback: ['항목', '지금', '고칠 점'],
  strategy: ['구분', '섹션', '바꿀 점'],
} as const

/** A plan or feedback as the markdown table (push-be names a plan by its kind; the mock prefixes it with its scenario, so the kind is the id's end), as the bot's bubble draws it (ChatPh1Feedback, ChatPh2). Blueprints are a list, see blueprintList. */
export const planTable = (item: PlanItem): TableBlock => ({
  kind: 'table',
  head: [...HEADS[item.id.endsWith('feedback') ? 'feedback' : 'strategy']],
  rows: item.rows.map((r) => [r.tag, r.label, r.note]),
})

export const isBlueprints = (item: PlanItem) => isVerdictPlan(item.rows)

/** The project blueprints as one line per project, a conditional one marked, and the grey line that opens each project's reason (ChatPh2XBlueprints). */
export const blueprintList = (item: PlanItem) => ({
  lines: item.rows.map((r) => (r.tag === '통과' ? r.label : `${r.label} (${r.tag})`)),
  detail: { text: '기획서 자세히 보기 ›', more: item.rows.map((r) => `${r.label} · ${r.note}`).join('\n') },
})

/** The keywords a strategy adds, as grey sub-text under its table: the count until a tap opens them (ChatPh2). */
export const planKeywords = (item: PlanItem) =>
  item.keywords.length ? { text: `넣을 키워드 ${item.keywords.length}개 보기 ›`, more: `넣을 키워드 ${item.keywords.join(' · ')}` } : undefined
