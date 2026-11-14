import type { BotContract, ConversationTurn, Message, StreamEvent } from '@push/api-client'
import type { ChatEvent, ChatState } from '../types'
import { applyEvent, emptyChat } from './reducer'
import { mapEvent } from './stream'
import { approvalFromSections, sectionLabel, sectionSel } from './stream-v3'

type Card = Extract<StreamEvent, { type: 'approval' | 'choice' }>

const labelsOf = (card: Card | undefined, ids: string[]) => {
  if (card?.type === 'choice' && card.sections?.length && ids.includes('submit')) {
    const approval = approvalFromSections(card)
    return sectionLabel(approval, sectionSel(approval, ids))
  }
  return ids.flatMap((id) => card?.options.find((o) => o.id === id)?.label ?? []).join(', ')
}

const answerIds = (a: NonNullable<ConversationTurn['answer']>) => (a.optionIds?.length ? a.optionIds : a.optionId ? [a.optionId] : [])

/** Rebuilds a reopened conversation from GET .../turns (newest first) and its messages. */
export const restoreTurns = (turns: ConversationTurn[], messages: Message[]): ChatState => {
  const text = new Map(messages.map((m) => [m.id, m.text]))
  const cards = new Map<string, Card>()
  let s = emptyChat
  const put = (e: ChatEvent) => {
    s = applyEvent(s, e)
  }
  for (const t of [...turns].reverse()) {
    // Only the newest turn can still be waiting on a card.
    s = { ...s, approval: null, awaiting: null }
    const said = (t.userMessageId && text.get(t.userMessageId)) || (t.answer ? labelsOf(cards.get(t.answer.approvalId), answerIds(t.answer)) : '')
    if (said) put({ type: 'user', id: t.userMessageId ?? `ans-${t.jobId}`, text: said })
    let spoke = false
    for (const ev of t.events) {
      if (ev.type === 'approval' || ev.type === 'choice') {
        cards.set(ev.id, ev)
        const answered = ev.resolution && ev.resolution.status !== 'PENDING'
        if (answered && !(ev.type === 'choice' && ev.auto)) {
          const question = ev.resolution?.status === 'EXPIRED' ? mapEvent(ev).find((e) => e.type === 'approval') : undefined
          if (question?.type === 'approval') put({ type: 'stale', id: `stale-${ev.id}`, text: question.approval.question })
          continue
        }
      }
      if (ev.type === 'token') {
        spoke = true
        put({ type: 'agentText', id: `${t.jobId}-${ev.seq ?? s.items.length}`, text: ev.text })
        continue
      }
      for (const e of mapEvent(ev)) {
        put(e)
        if (e.type === 'approval') s = { ...s, awaiting: ev.type === 'choice' ? 'choice' : 'approval' }
      }
    }
    const reply = !spoke && t.assistantMessageId ? text.get(t.assistantMessageId) : undefined
    if (reply) put({ type: 'agentText', id: t.assistantMessageId!, text: reply })
  }
  return { ...s, working: null, runStartedAt: null }
}

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

/** A card nobody answered in time: the server says EXPIRED, or its own expiresAt has gone by. */
const lapsed = (ev: Card, now: number) => {
  const expiresAt = (ev as { expiresAt?: string | null }).expiresAt
  return ev.resolution?.status === 'EXPIRED' || (ev.resolution?.status === 'PENDING' && !!expiresAt && Date.parse(expiresAt) <= now)
}

export const restoreBotTurns = (turns: BotContract.Turn[], live?: { turnId: string; lastSeq: number } | null): ChatState => {
  let s = emptyChat
  const put = (e: ChatEvent) => {
    s = applyEvent(s, e)
  }
  const now = Date.now()
  const ordered = [...turns].reverse()
  for (const [i, t] of ordered.entries()) {
    s = { ...s, approval: null, awaiting: null }
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
      const card = ev.type === 'approval' || ev.type === 'choice' ? (ev as Card) : undefined
      // An earlier turn's card that ran out is a 확인 대기 중 · 멈춤 line, not an open panel (ChatResume); only the newest turn can still be waiting.
      if (card && i < ordered.length - 1 && lapsed(card, now)) {
        const question = mapEvent(card).find((e) => e.type === 'approval')
        if (question?.type === 'approval') put({ type: 'stale', id: `stale-${card.id}`, text: question.approval.question })
        continue
      }
      for (const e of mapEvent(ev as StreamEvent, t.id)) {
        // A reopened chat has no run on screen, so a card that was asked in an earlier visit draws no live waiting line (ChatResume); a reattached run does.
        put(e.type === 'approval' && ev.type === 'choice' && t.id !== live?.turnId ? { ...e, approval: { ...e.approval, openedAt: undefined } } : e)
      }
    }
    if (t.assistant?.sources.length) put({ type: 'sources', sources: t.assistant.sources })
  }
  return { ...s, working: null, runStartedAt: null }
}
