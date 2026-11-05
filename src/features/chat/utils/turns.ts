import type { ConversationTurn, Message, StreamEvent } from '@push/api-client'
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
        if (answered && !(ev.type === 'choice' && ev.auto)) continue
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
