import type { StreamEvent, StreamOption } from '@push/api-client'
import {
  CHOICE_QUESTION,
  DEFAULT_ERROR_TEXT,
  ERROR_TEXT,
  FIT_ROWS,
  HINTLESS_GATES,
  MULTI_PICK_FOOT,
  MULTI_PICK_SUBMIT,
  PICK_HINT,
  queueBusyMessage,
} from '../constants'
import type { Approval, ChatEvent, ChatItem, Choice } from '../types'
import { resultTask } from './result-card'
import { approvalFromSections, mapPaper, mapPlan, mapThink } from './stream-v3'

const detailRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined

export const errorText = (code?: string, retryAfterSec?: number, reason?: unknown) =>
  code === 'QUEUE_BUSY' ? queueBusyMessage(retryAfterSec, reason) : (code && ERROR_TEXT[code]) || DEFAULT_ERROR_TEXT

type Ask = { id: string; question: string; options: StreamOption[]; multiple?: boolean; warning?: string; hint?: boolean; recommended?: string }

const choiceOf = (o: StreamOption): Choice => ({
  label: o.label,
  ...(o.desc ? { desc: o.desc } : {}),
  ...(o.badge ? { badge: { label: o.badge, tone: 'ac' as const } } : {}),
})

// A submit gate answers with its sections' selected ids, any other gate (or an empty pick with no zero label) with recommended.
const autoPicks = (ev: Extract<StreamEvent, { type: 'choice' }>) => {
  const recommended = ev.options.find((o) => o.id === ev.recommended)?.label
  if (!ev.sections?.length || !ev.submit) return recommended
  const ids = ev.sections.flatMap((s) => ('selected' in s ? s.selected : []))
  const labels = ev.sections.flatMap((s) => s.options).filter((o) => ids.includes(o.id)).map((o) => o.label)
  return labels.length ? labels.join(', ') : (ev.submit.zeroLabel ?? recommended)
}

const ask = ({ id, question, options, multiple, warning, hint = true, recommended }: Ask): ChatEvent => {
  const first = Math.max(0, options.findIndex((o) => o.id === recommended))
  const approval: Approval = {
    id,
    question,
    foot: multiple ? MULTI_PICK_FOOT : warning || !hint ? undefined : PICK_HINT,
    warning,
    submit: multiple ? MULTI_PICK_SUBMIT : undefined,
    optionIds: options.map((o) => o.id),
    sections: [{ kind: 'choices', selected: multiple ? [] : [first], ...(multiple ? { multi: true as const } : {}), items: options.map(choiceOf) }],
  }
  return { type: 'approval', approval }
}

/** The edit card: preview of the change, then 그대로 두기 · 적용 side by side. */
const askEdit = (ev: Extract<StreamEvent, { type: 'approval' }>): ChatEvent[] => {
  const [apply, keep] = ev.options
  const approval: Approval = {
    id: ev.id,
    question: ev.title,
    foot: PICK_HINT,
    optionIds: ev.options.map((o) => o.id),
    sections: [],
    ...(apply ? { submit: apply.label } : {}),
    ...(keep ? { secondary: keep.label } : {}),
  }
  const diff: ChatItem[] = ev.hunks?.length ? [{ type: 'diff', id: `diff-${ev.id}`, lines: ev.hunks.map((h) => ({ n: h.line ?? undefined, sign: h.sign, text: h.text })) }] : []
  return [...diff, { type: 'approval', approval }]
}

const fitOf = (ev: Extract<StreamEvent, { type: 'fit' }>): ChatItem => {
  const rows = FIT_ROWS.flatMap((r) => {
    const score = ev.parts?.[r.key]
    return score === undefined ? [] : [{ label: r.label, score }]
  })
  const caption = ev.band ?? ev.topGap
  return {
    type: 'fit',
    id: `fit-${ev.seq ?? Date.now()}`,
    score: ev.score,
    ...(ev.from !== undefined ? { from: ev.from } : {}),
    ...(ev.delta ? { delta: ev.delta } : {}),
    ...(ev.note ? { note: ev.note } : {}),
    ...(caption ? { caption } : {}),
    ...(ev.plan ? { plan: ev.plan } : {}),
    ...(ev.summary ? { summary: ev.summary } : {}),
    ...(rows.length ? { rows } : {}),
    ...(ev.keywords?.length ? { keywords: ev.keywords } : {}),
    ...(ev.projected ? { projected: { label: ev.projected.label, bullets: ev.projected.bullets } } : {}),
  }
}

/** 다 됐어요! line above the result card, with the score change in bold. */
const doneLine = (ev: Extract<StreamEvent, { type: 'result' }>): ChatItem[] => {
  if (!ev.summary) return []
  const change = ev.fitFrom !== undefined && ev.fitTo !== undefined ? `${ev.fitFrom.toFixed(1)} → ${ev.fitTo.toFixed(1)}` : ''
  const text = change ? ev.summary.replace(change, `**${change}**`) : ev.summary
  return [{ type: 'agentText', id: `done-${ev.documentId}`, text, ...(ev.bullets?.length ? { bullets: ev.bullets } : {}) }]
}

/** 이력서 수정 · 올린 파일 · 경력 → a finished tool line above the summary, as the done artboards draw it. */
const taskOf = (ev: Extract<StreamEvent, { type: 'result' }>): ChatItem[] =>
  ev.taskLine ? [{ type: 'tool', id: `task-${ev.documentId}`, state: 'ok', ...resultTask(ev.taskLine) }] : []

const resultOf = (ev: Extract<StreamEvent, { type: 'result' }>): ChatItem => {
  const base = { type: 'result' as const, id: `result-${ev.documentId}`, checklist: ev.checklist, documentId: ev.documentId, company: ev.company, actions: ev.actions }
  return ev.source === 'external'
    ? { ...base, source: ev.source, fileName: ev.fileName, pageLine: ev.pageLine, savedLine: ev.savedLine, cardMeta: ev.cardMeta }
    : { ...base, source: ev.source, name: ev.name, headline: ev.headline, title: ev.title, subtitle: ev.subtitle }
}

/** One server frame → transcript events (an edit card or a result can add a line before itself). */
export const mapEvent = (ev: StreamEvent): ChatEvent[] => {
  switch (ev.type) {
    case 'token':
      return [{ type: 'token', text: ev.text }]
    case 'status':
      return [{ type: 'status', verbs: [ev.text] }]
    case 'tool': {
      const error = ev.state === 'err' && typeof ev.result?.error === 'string' ? ev.result.error : undefined
      return [
        {
          type: 'tool',
          id: `tool-${ev.name}`,
          name: ev.name,
          action: ev.summary,
          state: ev.state,
          error,
          ...(ev.target ? { target: ev.target } : {}),
          ...(ev.resultLine ? { result: ev.resultLine } : {}),
          ...(ev.extra?.length ? { extra: ev.extra } : {}),
          ...(ev.warning ? { warning: ev.warning } : {}),
        },
      ]
    }
    case 'approval':
      if (ev.kind === 'DOCUMENT_EDIT') return askEdit(ev)
      return [ask({ id: ev.id, question: ev.summary || ev.title, options: ev.options, warning: ev.foot })]
    case 'choice': {
      // push-be #224 auto mode still sends sections; the auto line wins.
      if (!ev.auto && ev.sections?.length) return [{ type: 'approval', approval: approvalFromSections(ev) }]
      if (!ev.auto) {
        const pending = ev.note && (!ev.resolution || ev.resolution.status === 'PENDING') ? ev.note : undefined
        const event = ask({ id: ev.id, question: ev.title ?? CHOICE_QUESTION, options: ev.options, multiple: ev.multiple, hint: !HINTLESS_GATES.includes(ev.gate ?? ''), recommended: ev.recommended })
        if (event.type === 'approval' && pending) event.approval.pendingNote = pending
        return [event]
      }
      const picked = autoPicks(ev)
      return picked ? [{ type: 'agentText', id: `auto-${ev.id}`, text: `자동으로 골랐어요: ${picked}` }] : []
    }
    case 'think':
      return [mapThink(ev)]
    case 'plan':
      return [mapPlan(ev)]
    case 'paper':
      return [mapPaper(ev)]
    case 'file':
      return [{ type: 'file', id: `file-${ev.fileId}`, name: ev.name, url: ev.downloadUrl, preview: true }]
    case 'result':
      return [...taskOf(ev), ...doneLine(ev), resultOf(ev)]
    case 'todo':
      return [{ type: 'todo', id: ev.id ? `todo-${ev.id}` : 'todo', items: ev.items.map((i) => ({ label: i.text, state: i.state, ...(i.added ? { added: true } : {}) })) }]
    case 'diff':
      return [{ type: 'diff', id: `diff-${ev.revisionId}`, lines: ev.hunks.map((h) => ({ n: h.line ?? undefined, sign: h.sign, text: h.text })) }]
    case 'fit':
      return [fitOf(ev)]
    case 'error': {
      const details = detailRecord(ev.error.details)
      const retry = details?.retryAfterSec
      const sec = typeof retry === 'number' ? retry : undefined
      return [{ type: 'error', id: `err-${ev.seq ?? Date.now()}`, text: errorText(ev.error.code, sec, details?.reason), code: ev.error.code }]
    }
    case 'cancelled':
      return [{ type: 'stop' }]
    case 'done':
      return [{ type: 'done', at: 0, awaiting: ev.awaiting }]
    default:
      // push-be #224: a type this build does not know must not stop the stream.
      return []
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
      yield* mapEvent(ev)
      if (ev.type === 'done' || ev.type === 'error' || ev.type === 'cancelled') return
    }
    if (!got && source !== first) return
    // Without seq a resume would replay from the start and duplicate text.
    if (got && seq === undefined) return
  }
}
