import type { BotContract, StreamEvent } from '@push/api-client'
import type { ChatEvent, ChatState } from '../types'
import { applyEvent, emptyChat } from './reducer'
import { mapEvent } from './stream'
import { pausedOn, runItems } from './surface'

export const openPieceId = (turns: BotContract.Turn[], live?: { turnId: string; lastSeq: number } | null) => {
  if (!live) return undefined
  const t = turns.find((turn) => turn.id === live.turnId)
  if (!t) return undefined
  let piece: string | undefined
  let open = false
  for (const ev of t.events) {
    if (ev.seq > live.lastSeq) break
    if (ev.type === 'token') {
      if (!open) piece = `${t.id}:${ev.seq}`
      open = true
      continue
    }
    if (ev.type === 'status') continue
    open = false
    piece = undefined
  }
  return open ? piece : undefined
}

export const restoreBotTurns = (turns: BotContract.Turn[], live?: { turnId: string; lastSeq: number } | null): ChatState => {
  let s = emptyChat
  const put = (e: ChatEvent) => {
    s = applyEvent(s, e)
  }
  const ordered = [...turns].reverse()
  let runAfter: string | null = null
  let named: string | null = null
  for (const t of ordered) {
    runAfter = s.items.at(-1)?.id ?? null
    named = null
    if (t.user?.text) put({ type: 'user', id: t.user.messageId, text: t.user.text })
    let piece: string | null = null
    const events = t.id === live?.turnId ? t.events.filter((ev) => ev.seq <= live.lastSeq) : t.events
    for (const ev of events) {
      if (ev.type === 'token') {
        if (!piece) {
          piece = `${t.id}:${ev.seq}`
          put({ type: 'agentText', id: piece, text: ev.text })
        } else put({ type: 'token', text: ev.text })
        continue
      }
      if (ev.type === 'status') {
        for (const e of mapEvent(ev as StreamEvent, t.id)) if (e.type === 'wait') named = e.surfaceId
        continue
      }
      piece = null
      for (const e of mapEvent(ev as StreamEvent, t.id)) put(e)
    }
    if (t.assistant?.sources.length) put({ type: 'sources', sources: t.assistant.sources })
  }
  const newest = turns[0]
  const waiting = newest && newest.status !== 'FAILED' && newest.status !== 'CANCELLED' ? pausedOn(runItems(s.items, runAfter), named) : null
  return { ...s, working: null, runStartedAt: null, waiting, awaiting: null, runAfter }
}
