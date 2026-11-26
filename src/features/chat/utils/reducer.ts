import type { ChatEvent, ChatItem, ChatState } from '../types'
import { answeredPatch, mergeSurface, pausedOn, reopenPatch, runItems, type SurfaceItem } from './surface'

export const emptyChat: ChatState = { items: [], working: null, waiting: null, awaiting: null, queue: [], interrupted: false, runStartedAt: null, runAfter: null }

const upsert = (items: ChatItem[], item: ChatItem) => {
  const i = items.findIndex((x) => x.id === item.id)
  if (i < 0) return [...items, item]
  const next = items.slice()
  const current = items[i]!
  next[i] = current.type === 'surface' && item.type === 'surface' ? mergeSurface(current, item) : item
  return next
}

const patchSurface = (items: ChatItem[], surfaceId: string, patch: (item: SurfaceItem) => SurfaceItem['messages']) =>
  items.map((x) => (x.type === 'surface' && x.id === surfaceId ? { ...x, messages: [...x.messages, ...patch(x)] } : x))

export const applyEvent = (s: ChatState, e: ChatEvent): ChatState => {
  switch (e.type) {
    case 'start':
      return { ...s, runStartedAt: e.at, interrupted: false, waiting: null, awaiting: null, runAfter: s.items.at(-1)?.id ?? null, working: { verbs: ['생각하는 중…'], startedAt: e.at } }
    case 'status':
      return { ...s, working: { verbs: e.verbs, startedAt: s.working?.startedAt ?? s.runStartedAt ?? Date.now() } }
    case 'token': {
      const last = s.items[s.items.length - 1]
      if (last?.type === 'agentText' && !last.undo) return { ...s, items: [...s.items.slice(0, -1), { ...last, text: last.text + e.text }] }
      return { ...s, items: [...s.items, { type: 'agentText', id: `tok-${s.items.length}`, text: e.text }] }
    }
    case 'sources': {
      const at = s.items.findLastIndex((x) => x.type === 'agentText' || x.type === 'user')
      const line = s.items[at]
      if (!e.sources.length || line?.type !== 'agentText') return s
      return { ...s, items: s.items.map((x, i) => (i === at ? { ...line, sources: e.sources } : x)) }
    }
    case 'wait':
      return { ...s, waiting: e.surfaceId }
    case 'answer':
      return { ...s, waiting: null, awaiting: null, items: patchSurface(s.items, e.surfaceId, (x) => answeredPatch(x, e.picked)) }
    case 'reopen':
      return { ...s, waiting: e.surfaceId, items: patchSurface(s.items, e.surfaceId, reopenPatch) }
    case 'queue':
      return { ...s, queue: [...s.queue, { text: e.text, ...(e.file ? { file: e.file } : {}) }] }
    case 'dequeue':
      return { ...s, queue: s.queue.slice(1) }
    case 'stop': {
      const last = s.items[s.items.length - 1]
      const items = last?.type === 'notice' && last.notice.kind === 'stopped' ? s.items.slice(0, -1) : s.items
      return {
        ...s,
        working: null,
        waiting: null,
        awaiting: null,
        interrupted: true,
        runStartedAt: null,
        items: upsert(items, { type: 'notice', id: `stopped-${e.turn ?? items.length}`, notice: { kind: 'stopped', resumable: e.resumable === true } }),
      }
    }
    case 'done': {
      const seconds = s.runStartedAt === null ? 0 : Math.max(1, Math.round((e.at - s.runStartedAt) / 1000))
      const awaiting = e.awaiting ?? null
      return {
        ...s,
        working: null,
        runStartedAt: null,
        awaiting,
        waiting: awaiting ? pausedOn(runItems(s.items, s.runAfter), s.waiting) : null,
        items: [...s.items, { type: 'worked', id: `worked-${s.items.length}`, seconds }],
      }
    }
    case 'tool': {
      if (!e.name) return { ...s, items: upsert(s.items, e) }
      const open = s.items.findLastIndex((x) => x.type === 'tool' && x.name === e.name && (x.state === 'run' || x.state === 'wait'))
      return { ...s, items: upsert(s.items, { ...e, id: open < 0 ? `tool-${s.items.length}` : s.items[open]!.id }) }
    }
    case 'error':
      return { ...s, working: null, runStartedAt: null, items: upsert(s.items, e) }
    default:
      return { ...s, items: upsert(s.items, e) }
  }
}

