import type { ChatEvent, ChatItem, ChatState } from '../types'
import { formatElapsed, type LiveLine, type Notice } from './status-line'
import { attachPendingNote, clearPendingNote } from './stream-v3'

export { formatElapsed }

export const emptyChat: ChatState = { items: [], working: null, approval: null, awaiting: null, queue: [], interrupted: false, runStartedAt: null }

const upsert = (items: ChatItem[], item: ChatItem) => {
  const i = items.findIndex((x) => x.id === item.id)
  if (i < 0) return [...items, item]
  const next = items.slice()
  next[i] = item
  return next
}

export const applyEvent = (s: ChatState, e: ChatEvent): ChatState => {
  switch (e.type) {
    case 'start':
      return { ...s, runStartedAt: e.at, interrupted: false, approval: null, awaiting: null, working: { verbs: ['생각하는 중…'], startedAt: e.at } }
    case 'status':
      return { ...s, working: { verbs: e.verbs, startedAt: s.working?.startedAt ?? s.runStartedAt ?? 0 } }
    case 'token': {
      // Real SSE sends text in pieces: grow the last agent line until something else lands after it.
      const last = s.items[s.items.length - 1]
      if (last?.type === 'agentText') return { ...s, items: [...s.items.slice(0, -1), { ...last, text: last.text + e.text }] }
      return { ...s, items: [...s.items, { type: 'agentText', id: `tok-${s.items.length}`, text: e.text }] }
    }
    case 'approval':
      return { ...s, working: null, approval: e.approval, items: attachPendingNote(s.items, e.approval.pendingNote) }
    case 'answer':
      return { ...s, approval: null, awaiting: null, items: [...clearPendingNote(s.items), { type: 'user', id: `ans-${s.items.length}`, text: e.text }] }
    case 'queue':
      return { ...s, queue: [...s.queue, { text: e.text, ...(e.file ? { file: e.file } : {}) }] }
    case 'dequeue':
      return { ...s, queue: s.queue.slice(1) }
    case 'stop':
      return {
        ...s,
        working: null,
        approval: null,
        awaiting: null,
        interrupted: true,
        runStartedAt: null,
        items: s.items.map((it) =>
          it.type === 'tool' && it.state === 'run'
            ? { ...it, state: 'err', result: undefined, error: '중단됨 · 어떻게 할지 알려 주세요' }
            : it,
        ),
      }
    case 'done': {
      const seconds = s.runStartedAt === null ? 0 : Math.max(1, Math.round((e.at - s.runStartedAt) / 1000))
      return {
        ...s,
        working: null,
        runStartedAt: null,
        awaiting: e.awaiting ?? null,
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

export type TranscriptSource = { id: string; title: string }

export type TranscriptEntry =
  | { type: 'user'; id: string; text: string }
  | { type: 'bot'; id: string; text: string; sources: TranscriptSource[] }
  | { type: 'status'; id: string; line: LiveLine }
  | { type: 'notice'; id: string; notice: Notice }
  | { type: 'card'; id: string; text: string }

export type TranscriptEvent =
  | { type: 'turn'; turnId: string }
  | { type: 'status'; line: LiveLine }
  | { type: 'token'; text: string }
  | { type: 'boundary' }
  | { type: 'user'; text: string }
  | { type: 'answered' }
  | { type: 'entry'; entry: Extract<TranscriptEntry, { type: 'card' }> }
  | { type: 'end'; outcome: 'done' | 'paused'; sources?: TranscriptSource[] }
  | { type: 'end'; outcome: 'stopped'; resumable: boolean }
  | { type: 'end'; outcome: 'error'; code?: string; reason: string | null }

export type TranscriptState = {
  entries: TranscriptEntry[]
  turnId: string | null
  lastSeq: number | null
  openIndex: number | null
  botCount: number
  ended: boolean
}

export const emptyTranscript: TranscriptState = { entries: [], turnId: null, lastSeq: null, openIndex: null, botCount: 0, ended: false }

const closeBot = (state: TranscriptState): TranscriptState => (state.openIndex === null ? state : { ...state, openIndex: null })

const withoutKind = (entries: TranscriptEntry[], kind: 'run' | 'waiting') => entries.filter((entry) => !(entry.type === 'status' && entry.line.kind === kind))

const withSources = (entries: TranscriptEntry[], turnId: string | null, sources: TranscriptSource[]) => {
  if (!turnId || sources.length === 0) return entries
  const index = entries.findLastIndex((entry) => entry.type === 'bot' && entry.id.startsWith(`${turnId}:`))
  const bot = entries[index]
  if (bot?.type !== 'bot') return entries
  const next = entries.slice()
  next[index] = { ...bot, sources }
  return next
}

export const applyTranscript = (state: TranscriptState, event: TranscriptEvent, seq?: number): TranscriptState => {
  if (seq !== undefined && state.lastSeq !== null && seq <= state.lastSeq) return state
  const stamped = seq === undefined || seq === state.lastSeq ? state : { ...state, lastSeq: seq }
  if (event.type === 'end' && state.ended) return stamped
  const current = closeBot(stamped)
  switch (event.type) {
    case 'turn':
      return { ...current, turnId: event.turnId, ended: false, botCount: 0, openIndex: null, entries: withoutKind(current.entries, 'waiting') }
    case 'status': {
      const open = stamped.openIndex === null ? undefined : stamped.entries[stamped.openIndex]
      const entries = [...withoutKind(stamped.entries, event.line.kind), { type: 'status' as const, id: `${stamped.turnId ?? 'turn'}:status:${event.line.kind}`, line: event.line }]
      const openIndex = open?.type === 'bot' ? entries.indexOf(open) : -1
      return { ...stamped, entries, openIndex: openIndex < 0 ? null : openIndex }
    }
    case 'token': {
      const open = stamped.openIndex === null ? undefined : stamped.entries[stamped.openIndex]
      if (open?.type === 'bot' && stamped.openIndex !== null) {
        const entries = stamped.entries.slice()
        entries[stamped.openIndex] = { ...open, text: open.text + event.text }
        return { ...stamped, entries }
      }
      return {
        ...stamped,
        openIndex: stamped.entries.length,
        botCount: stamped.botCount + 1,
        entries: [...stamped.entries, { type: 'bot', id: `${stamped.turnId ?? 'turn'}:bot:${stamped.botCount}`, text: event.text, sources: [] }],
      }
    }
    case 'boundary':
      return current
    case 'user':
      return { ...current, entries: [...current.entries, { type: 'user', id: `${current.turnId ?? 'turn'}:user:${current.entries.length}`, text: event.text }] }
    case 'answered':
      return { ...current, entries: withoutKind(current.entries, 'waiting') }
    case 'entry': {
      const index = current.entries.findIndex((entry) => entry.id === event.entry.id)
      const sameTurn = current.turnId !== null && event.entry.id.startsWith(`${current.turnId}:`)
      if (index >= 0 && !sameTurn) return current
      if (index < 0) return { ...current, entries: [...current.entries, event.entry] }
      const entries = current.entries.slice()
      entries[index] = event.entry
      return { ...current, entries }
    }
    case 'end': {
      let entries = withoutKind(current.entries, 'run')
      if (event.outcome !== 'paused') entries = withoutKind(entries, 'waiting')
      if (event.outcome === 'done') entries = withSources(entries, current.turnId, event.sources ?? [])
      if (event.outcome === 'stopped') {
        entries = [...entries, { type: 'notice', id: `${current.turnId ?? 'turn'}:notice:stopped`, notice: { kind: 'stopped', resumable: event.resumable } }]
      }
      if (event.outcome === 'error') {
        entries = [...entries, { type: 'notice', id: `${current.turnId ?? 'turn'}:notice:error`, notice: { kind: 'error', code: event.code, reason: event.reason } }]
      }
      return { ...current, ended: true, entries }
    }
    default:
      return current
  }
}

export const projectTranscript = (events: readonly TranscriptEvent[]) => events.reduce((state, event) => applyTranscript(state, event), emptyTranscript)
