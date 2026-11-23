import type { A2uiComponent, A2uiMessage } from '@push/api-client'
import type { ChatItem, DiffLine } from '../types'

export type SurfaceItem = Extract<ChatItem, { type: 'surface' }>

/** Only approval and choice surfaces take an answer (through PushChoice). */
const isGate = (item: ChatItem): item is SurfaceItem => item.type === 'surface' && (item.kind === 'approval' || item.kind === 'choice')

/** A frame for a surface already on screen: its createSurface would be an error, so only its other messages are added. */
export const mergeSurface = (current: SurfaceItem, next: SurfaceItem): SurfaceItem => ({
  ...current,
  kind: next.kind,
  messages: [...current.messages, ...next.messages.filter((m) => !('createSurface' in m))],
})

// Every patch speaks the surface's own protocol version, so this file stays version-blind.
const versionOf = (item: SurfaceItem) => item.messages[0]?.version ?? 'v0.9.1'

const patch = (item: SurfaceItem, path: string, value: unknown) =>
  ({ version: versionOf(item), updateDataModel: { surfaceId: item.id, path, value } }) as A2uiMessage

/** Answered: the surface closes in place and keeps what was picked. The server sends no update for an answer. */
export const answeredPatch = (item: SurfaceItem, picked: string[]): A2uiMessage[] => [patch(item, '/open', false), patch(item, '/picked', picked)]

/** The answer did not reach the server: the surface takes an answer again. */
export const reopenPatch = (item: SurfaceItem): A2uiMessage[] => [patch(item, '/open', true), patch(item, '/picked', [])]

const setAt = (model: Record<string, unknown>, path: string, value: unknown) => {
  const key = path.replace(/^\//, '')
  // shortcut: only "/" and top-level keys, the only paths the server and the app write. Walk nested pointers if a surface ever binds one.
  return key ? { ...model, [key]: value } : ((value ?? {}) as Record<string, unknown>)
}

/** The surface's data model after every message so far. */
export const dataModel = (item: SurfaceItem): Record<string, unknown> =>
  item.messages.reduce<Record<string, unknown>>((model, m) => ('updateDataModel' in m ? setAt(model, m.updateDataModel.path ?? '/', m.updateDataModel.value) : model), {})

/** Still takes an answer: a gate whose `/open` is true. */
const isOpen = (item: ChatItem) => isGate(item) && dataModel(item).open === true

/** The surface's components as the last updateComponents left them. */
export const components = (item: SurfaceItem): A2uiComponent[] => {
  const last = item.messages.findLast((m) => 'updateComponents' in m)
  return last && 'updateComponents' in last ? last.updateComponents.components : []
}

export const componentOf = (item: SurfaceItem, type: string) => components(item).find((c) => c.component === type)

/** The items of the newest run: everything after `after`, the last item before it began (null: every item). */
export const runItems = (items: readonly ChatItem[], after: string | null) => items.slice(after === null ? 0 : items.findIndex((x) => x.id === after) + 1)

/**
 * The surface a paused run waits on, for the live stream and a reopened chat alike (api-spec 3.3): the one its latest waiting
 * status named while that still takes an answer, else the newest gate the run sent that does. `run` holds only that run's
 * items, so a gate an earlier run left open never waits again.
 */
export const pausedOn = (run: readonly ChatItem[], named: string | null) =>
  named !== null && run.some((x) => x.id === named && isOpen(x)) ? named : (run.findLast(isOpen)?.id ?? null)

type Choice = { id?: string; label?: string; change?: boolean }
type ChoiceProps = { questions?: { choices?: Choice[] }[] }

/** The choices of the surface's PushChoice. */
export const choicesOf = (item: SurfaceItem): Choice[] =>
  ((componentOf(item, 'PushChoice') as ChoiceProps | undefined)?.questions ?? []).flatMap((q) => q.choices ?? [])

/** A material row with a 변경 link: the change modal needs the person's 서류 and bookmarks loaded. */
export const hasMaterialRow = (item: SurfaceItem) => choicesOf(item).some((c) => c.change)

type DocumentProps = { documentId?: string; name?: string; actions?: { id?: string; label?: string }[] }

/** The PushDocument of a result or paper surface. */
export const documentOf = (item: SurfaceItem) => componentOf(item, 'PushDocument') as DocumentProps | undefined

/** The lines of the PushDiff that shows this document, as the review page draws them. */
export const diffLinesOf = (item: SurfaceItem, documentId: string): DiffLine[] | undefined => {
  const diff = components(item).find((c) => c.component === 'PushDiff' && c.documentId === documentId) as { lines?: { sign?: string; text?: string }[] } | undefined
  return diff?.lines?.map((l) => ({ sign: l.sign === '+' || l.sign === '-' ? l.sign : '', text: l.text ?? '' }))
}

const APPLY_SUFFIX = '에 바로 지원하기'

/** The company an apply button names ("모아페이에 바로 지원하기"): the chat message names it the same way. */
export const applyCompany = (label?: string) => (label?.endsWith(APPLY_SUFFIX) ? label.slice(0, -APPLY_SUFFIX.length) || undefined : undefined)
