import type { ChatEvent, ChatItem, ChatState } from '../types'

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
      return { ...s, working: null, approval: e.approval }
    case 'answer':
      return { ...s, approval: null, awaiting: null, items: [...s.items, { type: 'user', id: `ans-${s.items.length}`, text: e.text }] }
    case 'queue':
      return { ...s, queue: [...s.queue, e.text] }
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

export const formatElapsed = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const sec = seconds % 60
  return m ? `${m}분 ${sec}초` : `${sec}초`
}
