import { stageFlow } from './my-rules'

export const stageSteps = (stage: string, appliedAt: string | null) => {
  const { step, labels } = stageFlow(stage)
  const applied = appliedAt ? new Date(appliedAt) : null
  return labels.map((label, i) => ({
    label,
    // shortcut: push-be has no per-stage times yet, so only 지원 shows a date.
    date: i === 0 && applied ? `${applied.getMonth() + 1}.${String(applied.getDate()).padStart(2, '0')}` : null,
    state: i < step ? 'done' : i === step ? 'now' : 'todo',
  }))
}
