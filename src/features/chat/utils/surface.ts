import type { A2uiComponent, A2uiMessage } from '@push/api-client'
import type { ChatItem, DiffLine } from '../types'

export type SurfaceItem = Extract<ChatItem, { type: 'surface' }>

const isGate = (item: ChatItem): item is SurfaceItem => item.type === 'surface' && (item.kind === 'approval' || item.kind === 'choice')

export const mergeSurface = (current: SurfaceItem, next: SurfaceItem): SurfaceItem => ({
  ...current,
  kind: next.kind,
  messages: [...current.messages, ...next.messages.filter((m) => !('createSurface' in m))],
})

const versionOf = (item: SurfaceItem) => item.messages[0]?.version ?? 'v0.9.1'

const patch = (item: SurfaceItem, path: string, value: unknown) =>
  ({ version: versionOf(item), updateDataModel: { surfaceId: item.id, path, value } }) as A2uiMessage

export const answeredPatch = (item: SurfaceItem, picked: string[]): A2uiMessage[] => [patch(item, '/open', false), patch(item, '/picked', picked)]

export const reopenPatch = (item: SurfaceItem): A2uiMessage[] => [patch(item, '/open', true), patch(item, '/picked', [])]

const setAt = (model: Record<string, unknown>, path: string, value: unknown) => {
  const key = path.replace(/^\//, '')
  return key ? { ...model, [key]: value } : ((value ?? {}) as Record<string, unknown>)
}

export const dataModel = (item: SurfaceItem): Record<string, unknown> =>
  item.messages.reduce<Record<string, unknown>>((model, m) => ('updateDataModel' in m ? setAt(model, m.updateDataModel.path ?? '/', m.updateDataModel.value) : model), {})

const isOpen = (item: ChatItem) => isGate(item) && dataModel(item).open === true

export const components = (item: SurfaceItem): A2uiComponent[] => {
  const last = item.messages.findLast((m) => 'updateComponents' in m)
  return last && 'updateComponents' in last ? last.updateComponents.components : []
}

export const componentOf = (item: SurfaceItem, type: string) => components(item).find((c) => c.component === type)

export const runItems = (items: readonly ChatItem[], after: string | null) => items.slice(after === null ? 0 : items.findIndex((x) => x.id === after) + 1)

export const pausedOn = (run: readonly ChatItem[], named: string | null) =>
  named !== null && run.some((x) => x.id === named && isOpen(x)) ? named : (run.findLast(isOpen)?.id ?? null)

type Choice = { id?: string; label?: string; change?: boolean }
type ChoiceProps = { questions?: { choices?: Choice[] }[] }

export const choicesOf = (item: SurfaceItem): Choice[] =>
  ((componentOf(item, 'PushChoice') as ChoiceProps | undefined)?.questions ?? []).flatMap((q) => q.choices ?? [])

export const hasMaterialRow = (item: SurfaceItem) => choicesOf(item).some((c) => c.change)

type DocumentProps = { documentId?: string; name?: string; actions?: { id?: string; label?: string }[] }

export const documentOf = (item: SurfaceItem) => componentOf(item, 'PushDocument') as DocumentProps | undefined

export const diffLinesOf = (item: SurfaceItem, documentId: string): DiffLine[] | undefined => {
  const diff = components(item).find((c) => c.component === 'PushDiff' && c.documentId === documentId) as { lines?: { sign?: string; text?: string }[] } | undefined
  return diff?.lines?.map((l) => ({ sign: l.sign === '+' || l.sign === '-' ? l.sign : '', text: l.text ?? '' }))
}

const APPLY_SUFFIX = '에 바로 지원하기'

export const applyCompany = (label?: string) => (label?.endsWith(APPLY_SUFFIX) ? label.slice(0, -APPLY_SUFFIX.length) || undefined : undefined)
