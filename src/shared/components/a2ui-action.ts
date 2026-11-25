import { answerBody, type A2uiAnswerContext, type A2uiResultActionId } from '@push/api-client'

export type A2uiLocal =
  | { name: 'open_review' | 'share'; documentId: string }
  | { name: 'result_action'; id: A2uiResultActionId }
  | { name: 'open_plan' }
  | { name: 'change'; optionId: string }
  | { name: 'open_posting'; postingId: string }

type A2uiRouted = { kind: 'answer'; surfaceId: string; body: A2uiAnswerContext } | { kind: 'local'; surfaceId: string; action: A2uiLocal } | null

const RESULT_ACTIONS: readonly A2uiResultActionId[] = ['apply', 'convert', 'view', 'retry_save']

const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined)
const ids = (value: unknown) => (Array.isArray(value) && value.every((v) => typeof v === 'string') ? (value as string[]) : undefined)

const answerOf = (context: Record<string, unknown>): A2uiAnswerContext | null => {
  const optionId = text(context.optionId)
  const optionIds = ids(context.optionIds)
  if (!optionId) return null
  if (optionId === 'submit') return answerBody('submit', (optionIds ?? []).filter((id) => id !== 'submit'))
  return answerBody('pick', optionIds?.length ? optionIds : [optionId])
}

const localOf = (name: string, context: Record<string, unknown>): A2uiLocal | null => {
  switch (name) {
    case 'open_review':
    case 'share': {
      const documentId = text(context.documentId)
      return documentId ? { name, documentId } : null
    }
    case 'result_action': {
      const id = RESULT_ACTIONS.find((known) => known === context.id)
      return id ? { name, id } : null
    }
    case 'open_plan':
      return { name }
    case 'change': {
      const optionId = text(context.optionId)
      return optionId ? { name, optionId } : null
    }
    case 'open_posting': {
      const postingId = text(context.postingId)
      return postingId ? { name, postingId } : null
    }
    default:
      return null
  }
}

export const routeA2uiAction = (message: string, interactive: boolean): A2uiRouted => {
  let parsed: unknown
  try {
    parsed = JSON.parse(message)
  } catch {
    return null
  }
  const action = (parsed as { action?: { name?: unknown; surfaceId?: unknown; context?: unknown } } | null)?.action
  const name = text(action?.name)
  const surfaceId = text(action?.surfaceId)
  const context = action?.context && typeof action.context === 'object' ? (action.context as Record<string, unknown>) : {}
  if (!name || !surfaceId) return null
  if (name === 'answer') {
    const body = interactive ? answerOf(context) : null
    return body ? { kind: 'answer', surfaceId, body } : null
  }
  const local = localOf(name, context)
  return local ? { kind: 'local', surfaceId, action: local } : null
}
