import type { ApplicationStage } from '@push/api-client'
import { stageFlow } from './my-rules'

// The server stages that start each step. 지원 is dated by appliedAt, and 결과 by the first outcome reached.
const STEP_STAGES: readonly (readonly ApplicationStage[])[] = [[], ['SCREENING'], ['INTERVIEW'], ['OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']]

const dot = (iso: string | null | undefined) => {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}

export const stageSteps = (stage: string, appliedAt: string | null, entered: Partial<Record<ApplicationStage, string>> = {}) => {
  const { step, labels } = stageFlow(stage)
  return labels.map((label, i) => ({
    label,
    date: i > step ? null : i === 0 ? dot(appliedAt) : dot(STEP_STAGES[i]!.map((s) => entered[s]).filter(Boolean).sort()[0]),
    state: i < step ? 'done' : i === step ? 'now' : 'todo',
  }))
}
