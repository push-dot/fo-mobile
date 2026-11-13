import type { BotContract, StreamEvent, StreamOption } from '@push/api-client'
import {
  CHOICE_QUESTION,
  DEFAULT_ERROR_TEXT,
  ERROR_TEXT,
  FIT_ROWS,
  MULTI_PICK_SUBMIT,
  queueBusyMessage,
} from '../constants'
import type { Approval, ChatEvent, ChatItem, Choice } from '../types'
import { resultTask } from './result-card'
import { diffLines } from './diff-lines'
import { noticeOf } from './notices'
import { isSiteCard } from './card'
import { approvalFromSections, mapPaper, mapPlan, mapThink } from './stream-v3'

const detailRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined

/** A code with no sentence of its own, sent with a reason, is drawn as the status line's 작업 중 문제가 생겼어요 · {reason}. */
export const errorReason = (code: string | undefined, reason: unknown) =>
  code !== 'QUEUE_BUSY' && !(code && ERROR_TEXT[code]) && typeof reason === 'string' && reason ? reason : undefined

export const errorText = (code?: string, retryAfterSec?: number, reason?: unknown) =>
  code === 'QUEUE_BUSY' ? queueBusyMessage(retryAfterSec, reason) : (code && ERROR_TEXT[code]) || DEFAULT_ERROR_TEXT

type Ask = {
  id: string
  question: string
  options: StreamOption[]
  multiple?: boolean
  warning?: string
  recommended?: string
  /** Set for a card with a lifetime. `foot` replaces the pick hint, `detail` sits under the question. */
  tool?: Pick<Approval, 'detail' | 'foot' | 'openedAt' | 'expiresAt'>
}

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

const ask = ({ id, question, options, multiple, warning, recommended, tool }: Ask): ChatEvent => {
  const first = Math.max(0, options.findIndex((o) => o.id === recommended))
  const approval: Approval = {
    id,
    question,
    warning,
    submit: multiple ? MULTI_PICK_SUBMIT : undefined,
    optionIds: options.map((o) => o.id),
    sections: [{ kind: 'choices', selected: multiple || tool?.detail ? [] : [first], ...(multiple ? { multi: true as const } : {}), items: options.map(choiceOf) }],
    ...(tool ? { confirm: true as const, ...tool } : {}),
  }
  return { type: 'approval', approval }
}

const timeOf = (iso: string | undefined) => {
  const ms = iso === undefined ? NaN : Date.parse(iso)
  return Number.isNaN(ms) ? undefined : ms
}

/** A tool card's words and times. A stored card has openedAt; a live frame has only its stamp `at`, so the app reads the ask from that. */
const toolCard = (ev: Extract<StreamEvent, { type: 'approval' }>): Omit<Ask, 'id'> => {
  const stored = ev as { openedAt?: string; at?: string; expiresAt?: string | null }
  const expiresAt = timeOf(stored.expiresAt ?? undefined)
  const openedAt = timeOf(stored.openedAt ?? stored.at)
  // A frame with no stamp (a hand-written script) has no ask time, so it keeps no waiting line.
  const times = openedAt === undefined ? undefined : { openedAt, ...(expiresAt === undefined ? {} : { expiresAt }) }
  if (isSiteCard(ev.options.map((o) => o.id))) {
    return { question: ev.title, options: ev.options, tool: { ...times, ...(ev.summary ? { detail: ev.summary } : {}), ...(ev.foot ? { foot: ev.foot } : {}) } }
  }
  return { question: ev.summary || ev.title, options: ev.options, warning: ev.foot, tool: times }
}

/** The edit card: preview of the change, then 그대로 두기 · 적용 side by side. */
const askEdit = (ev: Extract<StreamEvent, { type: 'approval' }>): ChatEvent[] => {
  const [apply, keep] = ev.options
  const approval: Approval = {
    id: ev.id,
    question: ev.title,
    optionIds: ev.options.map((o) => o.id),
    sections: [],
    ...(apply ? { submit: apply.label } : {}),
    ...(keep ? { secondary: keep.label } : {}),
  }
  const diff: ChatItem[] = ev.hunks?.length ? [{ type: 'diff', id: `diff-${ev.id}`, lines: diffLines(ev.hunks) }] : []
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

/** One finished document is one run's result: the frame's seq keeps a second run on the same document from overwriting the first. */
const resultKey = (ev: Extract<StreamEvent, { type: 'result' }>) => (ev.seq === undefined ? ev.documentId : `${ev.documentId}-${ev.seq}`)

/** 다 됐어요! line above the result card, with the score change in bold. */
const doneLine = (ev: Extract<StreamEvent, { type: 'result' }>): ChatItem[] => {
  if (!ev.summary) return []
  const change = ev.fitFrom !== undefined && ev.fitTo !== undefined ? `${ev.fitFrom.toFixed(1)} → ${ev.fitTo.toFixed(1)}` : ''
  const text = change ? ev.summary.replace(change, `**${change}**`) : ev.summary
  return [{ type: 'agentText', id: `done-${resultKey(ev)}`, text, ...(ev.bullets?.length ? { bullets: ev.bullets } : {}) }]
}

/** 이력서 수정 · 올린 파일 · 경력 → a finished tool line above the summary, as the done artboards draw it. */
const taskOf = (ev: Extract<StreamEvent, { type: 'result' }>): ChatItem[] =>
  ev.taskLine ? [{ type: 'tool', id: `task-${resultKey(ev)}`, state: 'ok', ...resultTask(ev.taskLine) }] : []

const resultOf = (ev: Extract<StreamEvent, { type: 'result' }>): ChatItem => {
  const base = { type: 'result' as const, id: `result-${resultKey(ev)}`, checklist: ev.checklist, documentId: ev.documentId, company: ev.company, actions: ev.actions }
  return ev.source === 'external'
    ? { ...base, source: ev.source, fileName: ev.fileName, pageLine: ev.pageLine, savedLine: ev.savedLine, cardMeta: ev.cardMeta }
    : { ...base, source: ev.source, name: ev.name, headline: ev.headline, title: ev.title, subtitle: ev.subtitle }
}

/** One server frame → transcript events (an edit card or a result can add a line before itself). */
export const mapEvent = (ev: StreamEvent, turn?: string): ChatEvent[] => {
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
      return [ask({ id: ev.id, ...toolCard(ev) })]
    case 'choice': {
      // push-be #224 auto mode still sends sections; the auto line wins.
      if (!ev.auto && ev.sections?.length) return [{ type: 'approval', approval: approvalFromSections(ev) }]
      if (!ev.auto) {
        const pending = ev.note && (!ev.resolution || ev.resolution.status === 'PENDING') ? ev.note : undefined
        const event = ask({ id: ev.id, question: ev.title ?? CHOICE_QUESTION, options: ev.options, multiple: ev.multiple, recommended: ev.recommended })
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
      return [{ type: 'diff', id: `diff-${ev.revisionId}`, lines: diffLines(ev.hunks) }]
    case 'fit':
      return [fitOf(ev)]
    case 'error': {
      const details = detailRecord(ev.error.details)
      const retry = details?.retryAfterSec
      const sec = typeof retry === 'number' ? retry : undefined
      const reason = errorReason(ev.error.code, details?.reason)
      return [{ type: 'error', id: `err-${ev.seq ?? Date.now()}`, text: errorText(ev.error.code, sec, details?.reason), code: ev.error.code, ...(reason ? { reason } : {}) }]
    }
    case 'cancelled':
      return [{ type: 'stop', resumable: (ev as { resumable?: boolean }).resumable === true, ...(turn ? { turn } : {}) }]
    case 'done': {
      // The legacy StreamEvent type predates the bot stream's `sources`.
      const sources = (ev as { sources?: BotContract.Attachment[] }).sources
      return [...(sources?.length ? [{ type: 'sources' as const, sources }] : []), { type: 'done', at: 0, awaiting: ev.awaiting }]
    }
    default: {
      // push-be #224: a type this build does not know must not stop the stream.
      const notice = (ev as { type: string }).type === 'notice' ? noticeOf(ev as { text?: string; code?: string; seq?: number }, turn) : null
      return notice ? [notice] : []
    }
  }
}

type Frame = { type: string; seq?: number; turn?: string; text?: string }

export type StreamEnd = { reason: 'terminal' | 'reattach-empty' | 'no-seq' }

const turnOf = (ev: Frame) => (typeof ev.turn === 'string' ? ev.turn : undefined)

export const fromStream = async function* (
  first: AsyncIterable<Frame>,
  resume: (after?: number) => AsyncIterable<Frame>,
  end?: StreamEnd,
  open?: string,
): AsyncGenerator<ChatEvent> {
  const mark = (reason: StreamEnd['reason']) => {
    if (end) end.reason = reason
  }
  let seq: number | undefined
  let piece: string | null = open ?? null
  for (let source = first; ; source = resume(seq)) {
    let got = false
    for await (const ev of source) {
      got = true
      if (ev.seq !== undefined) seq = ev.seq
      const turn = turnOf(ev)
      if (ev.type === 'token' && turn && ev.seq !== undefined && ev.text !== undefined) {
        if (!piece?.startsWith(`${turn}:`)) {
          piece = `${turn}:${ev.seq}`
          yield { type: 'agentText', id: piece, text: ev.text }
        } else yield { type: 'token', text: ev.text }
      } else {
        if (ev.type !== 'status') piece = null
        yield* mapEvent(ev as StreamEvent, turn)
      }
      if (ev.type === 'done' || ev.type === 'error' || ev.type === 'cancelled') {
        mark('terminal')
        return
      }
    }
    if (!got) {
      mark('reattach-empty')
      return
    }
    // Without seq a resume would replay from the start and duplicate text.
    if (seq === undefined) {
      mark('no-seq')
      return
    }
  }
}
