import type { BotContract, StreamEvent } from '@push/api-client'
import type { ChatEvent, ChatState } from '../types'
import { applyEvent, emptyChat } from './reducer'
import { mapEvent } from './stream'
import { lastOpenGate } from './surface'

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

/**
 * Rebuilds a reopened chat from GET /bots/:id/transcript (newest turn first). A card replays as its surface with the answer
 * already in the data model (`/open` false, `/picked`), so an answered surface opens answered. Only the newest turn can still
 * wait: its last gate that still takes an answer is the waiting one.
 */
export const restoreBotTurns = (turns: BotContract.Turn[], live?: { turnId: string; lastSeq: number } | null): ChatState => {
  let s = emptyChat
  const put = (e: ChatEvent) => {
    s = applyEvent(s, e)
  }
  const ordered = [...turns].reverse()
  let newestStart = 0
  for (const t of ordered) {
    newestStart = s.items.length
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
      if (ev.type === 'status') continue
      piece = null
      for (const e of mapEvent(ev as StreamEvent, t.id)) put(e)
    }
    if (t.assistant?.sources.length) put({ type: 'sources', sources: t.assistant.sources })
  }
  const newest = turns[0]
  const waiting = newest && newest.status !== 'FAILED' && newest.status !== 'CANCELLED' ? lastOpenGate(s.items.slice(newestStart)) : null
  return { ...s, working: null, runStartedAt: null, waiting, awaiting: null }
}
