import type { A2uiFrame } from '@push/api-client'
import approvalEditV091 from '@push/api-client/a2ui-fixtures/approval-edit.json'
import approvalEditAnsweredV091 from '@push/api-client/a2ui-fixtures/approval-edit-answered.json'
import approvalSiteV091 from '@push/api-client/a2ui-fixtures/approval-site.json'
import approvalToolV091 from '@push/api-client/a2ui-fixtures/approval-tool.json'
import approvalToolAnsweredV091 from '@push/api-client/a2ui-fixtures/approval-tool-answered.json'
import choiceMultipleV091 from '@push/api-client/a2ui-fixtures/choice-multiple.json'
import choiceMultipleAnsweredV091 from '@push/api-client/a2ui-fixtures/choice-multiple-answered.json'
import choiceSectionsV091 from '@push/api-client/a2ui-fixtures/choice-sections.json'
import choiceSectionsAnsweredV091 from '@push/api-client/a2ui-fixtures/choice-sections-answered.json'
import choiceSingleV091 from '@push/api-client/a2ui-fixtures/choice-single.json'
import choiceSingleAnsweredV091 from '@push/api-client/a2ui-fixtures/choice-single-answered.json'
import choiceTemplatesV091 from '@push/api-client/a2ui-fixtures/choice-templates.json'
import diffV091 from '@push/api-client/a2ui-fixtures/diff.json'
import fitV091 from '@push/api-client/a2ui-fixtures/fit.json'
import fitBoostV091 from '@push/api-client/a2ui-fixtures/fit-boost.json'
import fitLockedV091 from '@push/api-client/a2ui-fixtures/fit-locked.json'
import paperV091 from '@push/api-client/a2ui-fixtures/paper.json'
import planFeedbackV091 from '@push/api-client/a2ui-fixtures/plan-feedback.json'
import planStrategyV091 from '@push/api-client/a2ui-fixtures/plan-strategy.json'
import resultV091 from '@push/api-client/a2ui-fixtures/result.json'
import resultProfileV091 from '@push/api-client/a2ui-fixtures/result-profile.json'
import resultSaveFailedV091 from '@push/api-client/a2ui-fixtures/result-save-failed.json'
import todoV091 from '@push/api-client/a2ui-fixtures/todo.json'
import approvalEditV1 from '@push/api-client/a2ui-fixtures/v1.0/approval-edit.json'
import approvalEditAnsweredV1 from '@push/api-client/a2ui-fixtures/v1.0/approval-edit-answered.json'
import approvalSiteV1 from '@push/api-client/a2ui-fixtures/v1.0/approval-site.json'
import approvalToolV1 from '@push/api-client/a2ui-fixtures/v1.0/approval-tool.json'
import approvalToolAnsweredV1 from '@push/api-client/a2ui-fixtures/v1.0/approval-tool-answered.json'
import choiceMultipleV1 from '@push/api-client/a2ui-fixtures/v1.0/choice-multiple.json'
import choiceMultipleAnsweredV1 from '@push/api-client/a2ui-fixtures/v1.0/choice-multiple-answered.json'
import choiceSectionsV1 from '@push/api-client/a2ui-fixtures/v1.0/choice-sections.json'
import choiceSectionsAnsweredV1 from '@push/api-client/a2ui-fixtures/v1.0/choice-sections-answered.json'
import choiceSingleV1 from '@push/api-client/a2ui-fixtures/v1.0/choice-single.json'
import choiceSingleAnsweredV1 from '@push/api-client/a2ui-fixtures/v1.0/choice-single-answered.json'
import choiceTemplatesV1 from '@push/api-client/a2ui-fixtures/v1.0/choice-templates.json'
import diffV1 from '@push/api-client/a2ui-fixtures/v1.0/diff.json'
import fitV1 from '@push/api-client/a2ui-fixtures/v1.0/fit.json'
import fitBoostV1 from '@push/api-client/a2ui-fixtures/v1.0/fit-boost.json'
import fitLockedV1 from '@push/api-client/a2ui-fixtures/v1.0/fit-locked.json'
import paperV1 from '@push/api-client/a2ui-fixtures/v1.0/paper.json'
import planFeedbackV1 from '@push/api-client/a2ui-fixtures/v1.0/plan-feedback.json'
import planStrategyV1 from '@push/api-client/a2ui-fixtures/v1.0/plan-strategy.json'
import resultV1 from '@push/api-client/a2ui-fixtures/v1.0/result.json'
import resultProfileV1 from '@push/api-client/a2ui-fixtures/v1.0/result-profile.json'
import resultSaveFailedV1 from '@push/api-client/a2ui-fixtures/v1.0/result-save-failed.json'
import todoV1 from '@push/api-client/a2ui-fixtures/v1.0/todo.json'
import { A2UI_VERSION } from '../shared/infrastructure/a2ui-version'

const V091 = {
  'approval-edit': approvalEditV091,
  'approval-edit-answered': approvalEditAnsweredV091,
  'approval-site': approvalSiteV091,
  'approval-tool': approvalToolV091,
  'approval-tool-answered': approvalToolAnsweredV091,
  'choice-multiple': choiceMultipleV091,
  'choice-multiple-answered': choiceMultipleAnsweredV091,
  'choice-sections': choiceSectionsV091,
  'choice-sections-answered': choiceSectionsAnsweredV091,
  'choice-single': choiceSingleV091,
  'choice-single-answered': choiceSingleAnsweredV091,
  'choice-templates': choiceTemplatesV091,
  'diff': diffV091,
  'fit': fitV091,
  'fit-boost': fitBoostV091,
  'fit-locked': fitLockedV091,
  'paper': paperV091,
  'plan-feedback': planFeedbackV091,
  'plan-strategy': planStrategyV091,
  'result': resultV091,
  'result-profile': resultProfileV091,
  'result-save-failed': resultSaveFailedV091,
  'todo': todoV091,
}

const V1: Record<keyof typeof V091, unknown> = {
  'approval-edit': approvalEditV1,
  'approval-edit-answered': approvalEditAnsweredV1,
  'approval-site': approvalSiteV1,
  'approval-tool': approvalToolV1,
  'approval-tool-answered': approvalToolAnsweredV1,
  'choice-multiple': choiceMultipleV1,
  'choice-multiple-answered': choiceMultipleAnsweredV1,
  'choice-sections': choiceSectionsV1,
  'choice-sections-answered': choiceSectionsAnsweredV1,
  'choice-single': choiceSingleV1,
  'choice-single-answered': choiceSingleAnsweredV1,
  'choice-templates': choiceTemplatesV1,
  'diff': diffV1,
  'fit': fitV1,
  'fit-boost': fitBoostV1,
  'fit-locked': fitLockedV1,
  'paper': paperV1,
  'plan-feedback': planFeedbackV1,
  'plan-strategy': planStrategyV1,
  'result': resultV1,
  'result-profile': resultProfileV1,
  'result-save-failed': resultSaveFailedV1,
  'todo': todoV1,
}

export type FixtureName = keyof typeof V091

export const fixtureFrame = (name: FixtureName, surfaceId: string, model?: Record<string, unknown>): A2uiFrame => {
  const raw = (A2UI_VERSION === '1.0' ? V1 : V091)[name] as A2uiFrame
  const { seq: _seq, at: _at, turn: _turn, ...frame } = JSON.parse(JSON.stringify(raw).replaceAll(`"${raw.surfaceId}"`, JSON.stringify(surfaceId))) as A2uiFrame & { seq?: number; at?: string; turn?: string }
  if (!model) return frame
  return {
    ...frame,
    messages: frame.messages.map((m) => ('updateDataModel' in m ? { ...m, updateDataModel: { ...m.updateDataModel, value: { ...(m.updateDataModel.value as object), ...model } } } : m)),
  }
}

export const choiceIds = (frame: A2uiFrame): string[] => {
  const update = frame.messages.find((m) => 'updateComponents' in m)
  const choice = update && 'updateComponents' in update ? update.updateComponents.components.find((c) => c.component === 'PushChoice') : undefined
  return ((choice?.questions as { choices?: { id: string }[] }[] | undefined) ?? []).flatMap((q) => (q.choices ?? []).map((c) => c.id))
}

export const withSurfaceId = (frame: A2uiFrame, surfaceId: string): A2uiFrame =>
  JSON.parse(JSON.stringify(frame).replaceAll(`"${frame.surfaceId}"`, JSON.stringify(surfaceId))) as A2uiFrame
