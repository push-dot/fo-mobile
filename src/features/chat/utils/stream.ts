import type { StreamEvent, StreamOption } from '@push/api-client'
import { CHOICE_QUESTION, DEFAULT_ERROR_TEXT, ERROR_TEXT, FIT_ROWS, queueBusyText, SAY_LABEL } from '../constants'
import type { Approval, ChatEvent } from '../types'

export const errorText = (code?: string, retryAfterSec?: number) =>
  code === 'QUEUE_BUSY' && retryAfterSec ? queueBusyText(retryAfterSec) : (code && ERROR_TEXT[code]) || DEFAULT_ERROR_TEXT

const ask = (id: string, question: string, options: StreamOption[], recommended?: string, foot?: string): ChatEvent => {
  const approval: Approval = {
    id,
    question,
    foot,
    optionIds: options.map((o) => o.id),
    sections: [
      {
        kind: 'choices',
        selected: [],
        items: [
          ...options.map((o) => (o.id === recommended ? { label: o.label, badge: { label: '추천', tone: 'ac' as const } } : { label: o.label })),
          { label: SAY_LABEL },
        ],
      },
    ],
  }
  return { type: 'approval', approval }
}

const map = (ev: StreamEvent): ChatEvent | null => {
  switch (ev.type) {
    case 'token':
      return { type: 'token', text: ev.text }
    case 'status':
      return { type: 'status', verbs: [ev.text] }
    case 'tool': {
      const error = ev.state === 'err' && typeof ev.result?.error === 'string' ? ev.result.error : undefined
      return { type: 'tool', id: `tool-${ev.name}`, name: ev.name, action: ev.summary, state: ev.state, error }
    }
    case 'approval':
      return ask(ev.id, ev.title, ev.options, undefined, ev.summary)
    case 'choice': {
      if (!ev.auto) return ask(ev.id, ev.title ?? CHOICE_QUESTION, ev.options, ev.recommended)
      const picked = ev.options.find((o) => o.id === ev.recommended)
      return picked ? { type: 'agentText', id: `auto-${ev.id}`, text: `자동으로 골랐어요: ${picked.label}` } : null
    }
    case 'file':
      return { type: 'file', id: `file-${ev.fileId}`, name: ev.name, tag: /\.([^.]+)$/.exec(ev.name)?.[1]?.toUpperCase(), url: ev.downloadUrl, preview: true }
    case 'todo':
      return { type: 'todo', id: 'todo', items: ev.items.map((i) => ({ label: i.text, state: i.state })) }
    case 'diff':
      return { type: 'diff', id: `diff-${ev.revisionId}`, lines: ev.hunks.map((h) => ({ n: h.line ?? undefined, sign: h.sign, text: h.text })) }
    case 'fit':
      return { type: 'fit', id: `fit-${Date.now()}`, score: ev.score, caption: ev.topGap, rows: FIT_ROWS.map((r) => ({ label: r.label, score: ev.parts[r.key] })) }
    case 'error':
      return { type: 'error', id: `err-${Date.now()}`, text: errorText(ev.error.code) }
    case 'cancelled':
      return { type: 'stop' }
    case 'done':
      return { type: 'done', at: 0, awaiting: ev.awaiting }
  }
}

/**
 * push-be SSE frames → transcript events. The gateway closes long streams early, so a stream that ends without a
 * terminal frame is resumed from the last `seq` until a resume brings nothing (the run finished).
 */
export const fromStream = async function* (
  first: AsyncIterable<StreamEvent>,
  resume: (after?: number) => AsyncIterable<StreamEvent>,
): AsyncGenerator<ChatEvent> {
  let seq: number | undefined
  for (let source = first; ; source = resume(seq)) {
    let got = false
    for await (const ev of source) {
      got = true
      if (ev.seq !== undefined) seq = ev.seq
      const e = map(ev)
      if (e) yield e
      if (ev.type === 'done' || ev.type === 'error' || ev.type === 'cancelled') return
    }
    if (!got && source !== first) return
    // Without seq a resume would replay from the start and duplicate text.
    if (got && seq === undefined) return
  }
}
