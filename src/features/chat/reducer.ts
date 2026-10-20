import type { ChatEvent, ChatItem, ChatState } from './types'

export const emptyChat: ChatState = { items: [], working: null, approval: null, queue: [], interrupted: false, runStartedAt: null }

const upsert = (items: ChatItem[], item: ChatItem) => {
  const i = items.findIndex((x) => x.id === item.id)
  if (i < 0) return [...items, item]
  const next = items.slice()
  next[i] = item
  return next
}

/** Applies one stream/script event to the transcript. Pure: timestamps come in on the event. */
export function applyEvent(s: ChatState, e: ChatEvent): ChatState {
  switch (e.type) {
    case 'start':
      return { ...s, runStartedAt: e.at, interrupted: false, approval: null, working: { verbs: ['생각하는 중…'], startedAt: e.at } }
    case 'status':
      return { ...s, working: { verbs: e.verbs, startedAt: s.working?.startedAt ?? s.runStartedAt ?? 0 } }
    case 'token': {
      // Real SSE sends text in pieces: grow the last agent line until something else lands after it.
      const last = s.items[s.items.length - 1]
      if (last?.type === 'agentText') return { ...s, items: [...s.items.slice(0, -1), { ...last, text: last.text + e.text }] }
      return { ...s, items: [...s.items, { type: 'agentText', id: `tok-${s.items.length}`, text: e.text }] }
    }
    case 'approval':
      return { ...s, working: null, approval: e.approval }
    case 'answer':
      return { ...s, approval: null, items: [...s.items, { type: 'user', id: `ans-${s.items.length}`, text: e.text }] }
    case 'queue':
      return { ...s, queue: [...s.queue, e.text] }
    case 'dequeue':
      return { ...s, queue: s.queue.slice(1) }
    case 'stop':
      return {
        ...s,
        working: null,
        approval: null,
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
        items: [...s.items, { type: 'worked', id: `worked-${s.items.length}`, seconds }],
      }
    }
    case 'error':
      return { ...s, working: null, runStartedAt: null, items: upsert(s.items, e) }
    default:
      return { ...s, items: upsert(s.items, e) }
  }
}

/** "1분 12초" / "14초" (StatusRow, "N분 N초 동안 작업했어요"). */
export const formatElapsed = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const sec = seconds % 60
  return m ? `${m}분 ${sec}초` : `${sec}초`
}
