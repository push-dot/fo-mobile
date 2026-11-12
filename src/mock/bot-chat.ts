// Mock of the chat routes addressed by bot (push-be bot-chat.ts and the Python transcript route).
// The thread is the bot fixture's messages, cards, and active job (bots.ts), so the list and the chat agree.
// A send answers a short scripted run as a real event stream. Board scenarios replace it in the chat lane.
import type { BotContract } from '@push/api-client'
import { atOf, consentRequired, fixtureOf, nextId, notFound, type BotFixture, type MockCard, type MockMessage } from './bots'
import { hasReferenceConsent } from './chat'
import { findMaterial } from './materials'
import { postings } from './postings'
import { mock } from './server'

type TurnEvent = BotContract.TurnEvent
/** A stored event before the thread gives it a seq and a time. */
type Unstamped = TurnEvent extends infer E ? (E extends unknown ? Omit<E, 'seq' | 'at'> : never) : never
type Frame = BotContract.StreamEvent

const REPLY = '정리했어요. 더 필요한 게 있으면 말해 주세요.'
const error = (status: number, code: string, message: string, details?: Record<string, unknown>) => ({ status, body: { error: { code, message, details } } })

const cardEvent = (c: MockCard, now: Date): Unstamped => {
  const resolution = { status: c.status, optionId: null }
  const times = { openedAt: atOf(c.at, now).toISOString(), expiresAt: c.expiresAt === null ? null : atOf(c.expiresAt, now).toISOString(), retryable: c.expiresAt !== null }
  return c.for === 'answer'
    ? { type: 'choice', id: c.id, title: c.title, options: c.options, resolution, ...times }
    : { type: 'approval', id: c.id, kind: 'TOOL_ACTION', title: c.title, options: c.options, ...(c.summary ? { summary: c.summary } : {}), resolution, ...times }
}

/** The stored turns of a thread, oldest first, with the seq every event carries on the wire. */
const turnsOf = (f: BotFixture, now: Date): BotContract.Turn[] => {
  const time = (at: MockMessage['at']) => atOf(at, now).getTime()
  const ids = [...new Set([...f.messages, ...f.cards, ...(f.job ? [f.job] : [])].sort((a, b) => time(a.at) - time(b.at)).map((x) => x.turn))]
  let seq = 0
  const stamp = (e: Unstamped, at: MockMessage['at']) => ({ ...e, seq: ++seq, at: atOf(at, now).toISOString() }) as TurnEvent
  return ids.map((id) => {
    const user = f.messages.find((m) => m.turn === id && m.role === 'USER')
    const bot = f.messages.findLast((m) => m.turn === id && m.role === 'ASSISTANT')
    const cards = f.cards.filter((c) => c.turn === id)
    const job = f.job?.turn === id ? f.job : null
    const events: TurnEvent[] = []
    if (job) {
      const since = atOf(job.at, now).toISOString()
      for (const s of job.statuses) {
        if (s.phase === 'queued') events.push(stamp({ type: 'status', text: s.text, phase: 'queued', since, ahead: 0 }, job.at))
        else if (s.phase) events.push(stamp({ type: 'status', text: s.text, phase: s.phase, since }, job.at))
      }
    }
    if (bot) events.push(stamp({ type: 'token', text: bot.text }, bot.at))
    // A finished turn keeps its waiting statuses, so an answered card still has the one it asked with.
    for (const c of cards) {
      const text = c.for === 'answer' ? '답을 기다리고 있어요' : '확인을 기다리고 있어요'
      events.push(stamp({ type: 'status', text, phase: 'waiting', since: atOf(c.at, now).toISOString(), for: c.for, cardId: c.id }, c.at))
      events.push(stamp(cardEvent(c, now), c.at))
    }
    const first = Math.min(...[user, bot, ...cards, job].flatMap((x) => (x ? [time(x.at)] : [])))
    return {
      id,
      status: job ? (job.status === 'QUEUED' ? 'PENDING' : 'RUNNING') : 'DONE',
      createdAt: new Date(first).toISOString(),
      user: user ? { messageId: user.id, text: user.text, attachments: user.attachments ?? [] } : null,
      answer: null,
      events,
      assistant: bot ? { messageId: bot.id, text: bot.text, sources: bot.sources ?? [] } : null,
    }
  })
}

const sse = (frames: Frame[], open = false) => {
  const bytes = new TextEncoder().encode(frames.map((f) => `id: ${'seq' in f ? f.seq : ''}\ndata: ${JSON.stringify(f)}\n\n`).join(''))
  // A run that is still going keeps its stream open, as the server does, until the client lets go.
  const body = new ReadableStream<Uint8Array>({
    start: (c) => {
      c.enqueue(bytes)
      if (!open) c.close()
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })
}

mock('GET', 'bots/:id/transcript', ({ params, query }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  const now = new Date()
  const turns = turnsOf(f, now)
  const newestFirst = [...turns].reverse()
  const limit = Math.min(Number(query.get('limit') ?? 30), 100)
  const start = Number(query.get('cursor') ?? 0)
  const next = start + limit < newestFirst.length ? String(start + limit) : null
  const running = f.job && turns.find((t) => t.id === f.job?.turn)
  const live = start === 0 && running ? { turnId: running.id, lastSeq: running.events.at(-1)?.seq ?? 0 } : null
  const body: BotContract.Transcript = { data: newestFirst.slice(start, start + limit), page: { nextCursor: next, hasMore: next !== null }, live }
  return body
})

mock('GET', 'bots/:id/transcript/matches', ({ params, query }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  const q = (query.get('q') ?? '').trim().toLowerCase()
  if (!q || [...q].length > 200) return error(400, 'VALIDATION_ERROR', 'q must be 1-200 characters', { field: 'q' })
  const now = new Date()
  const items = f.messages
    .filter((m) => m.text.toLowerCase().includes(q))
    .map((m) => ({ messageId: m.id, turnId: m.turn, at: atOf(m.at, now).toISOString() }))
    .sort((a, b) => b.at.localeCompare(a.at))
  const data: BotContract.TranscriptMatches = { total: items.length, items: items.slice(0, 200) }
  return { data }
})

const SEND_FIELDS = ['text', 'attachments', 'intent', 'accessMode', 'ai']
const MAX_ATTACHMENTS = 10

/** A material of the caller, or any posting: a posting needs no bookmark to be attached. */
const attachable = (ref: BotContract.AttachmentRef) =>
  findMaterial(ref.kind, ref.id) ?? (ref.kind === 'posting' ? postings.find((p) => p.id === ref.id) : undefined)

mock('POST', 'bots/:id/messages/stream', ({ params, body }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  const b = (body ?? {}) as Partial<BotContract.SendBody>
  const extra = Object.keys(b).find((k) => !SEND_FIELDS.includes(k))
  if (extra) return error(400, 'VALIDATION_ERROR', 'unknown field', { field: extra })
  const text = typeof b.text === 'string' ? b.text.trim() : ''
  if (!text || text.length > 20_000) return error(400, 'VALIDATION_ERROR', 'text must be 1-20000 characters', { field: 'text' })
  if ((b.attachments ?? []).length > MAX_ATTACHMENTS) return error(400, 'VALIDATION_ERROR', `at most ${MAX_ATTACHMENTS} attachments`, { field: 'attachments' })
  if (!hasReferenceConsent()) return consentRequired()
  const attachments: BotContract.Attachment[] = []
  for (const ref of b.attachments ?? []) {
    const m = attachable(ref)
    if (!m) return error(409, 'ATTACHMENT_GONE', 'an attached material is gone', { kind: ref.kind, id: ref.id })
    attachments.push({ kind: ref.kind, id: ref.id, title: m.title })
  }
  const turn = nextId('t')
  const now = new Date().toISOString()
  f.messages.push({ id: nextId('m'), turn, role: 'USER', text, at: now, attachments })
  f.messages.push({ id: nextId('m'), turn, role: 'ASSISTANT', text: REPLY, at: now })
  let seq = 0
  const stamp = { turn, at: now }
  const frames: Frame[] = [
    { type: 'status', text: '대기 중', phase: 'queued', since: now, ahead: 0, seq: ++seq, ...stamp },
    { type: 'status', text: '생각 중', phase: 'thinking', since: now, seq: ++seq, ...stamp },
    { type: 'status', text: '요청을 살펴보는 중', phase: 'working', since: now, seq: ++seq, ...stamp },
    { type: 'token', text: REPLY, seq: ++seq, ...stamp },
    { type: 'done', operation: null, seq: ++seq, ...stamp },
  ]
  return sse(frames)
})

/** Reattach: the running job's frames after `after`, held open. Nothing running is 204. */
mock('GET', 'bots/:id/stream', ({ params, query }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  if (!f.job) return { status: 204, body: null }
  const now = new Date()
  const after = Number(query.get('after') ?? 0)
  const turn = turnsOf(f, now).find((t) => t.id === f.job?.turn)
  const frames = (turn?.events ?? []).filter((e) => e.seq > after).map((e) => ({ ...e, turn: turn!.id }) as Frame)
  return sse(frames, true)
})

mock('POST', 'bots/:id/stream/cancel', ({ params }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  if (!f.job) return error(409, 'CONFLICT', 'nothing is running')
  f.job = null
  const data: BotContract.CancelResult = { status: 'CANCELLED', resumable: false }
  return { data }
})

const cardOf = (f: BotFixture, id: string) => f.cards.find((c) => c.id === id)

/** An approval resumes the run that asked (202, follow the stream). A rejection only closes the card. */
mock('POST', 'bots/:id/approvals/:approvalId', ({ params, body }) => {
  if (!hasReferenceConsent()) return consentRequired()
  const f = fixtureOf(params.id!)
  const card = f && cardOf(f, params.approvalId!)
  if (!card) return notFound()
  if (card.status !== 'PENDING') return error(409, 'APPROVAL_ALREADY_RESOLVED', 'the card was answered')
  const b = (body ?? {}) as { optionId?: string; optionIds?: string[] }
  const optionId = b.optionId ?? b.optionIds?.[0]
  if (!optionId || !card.options.some((o) => o.id === optionId)) return error(400, 'VALIDATION_ERROR', 'unknown option', { field: 'optionId' })
  const expired = card.expiresAt !== null && atOf(card.expiresAt, new Date()) <= new Date()
  if (expired && optionId !== 'reject') return error(410, 'APPROVAL_EXPIRED', 'the card expired')
  card.status = optionId === 'reject' ? 'REJECTED' : 'APPROVED'
  const data: BotContract.CardAnswer = { id: card.id, status: card.status, optionId }
  return { status: card.status === 'APPROVED' ? 202 : 200, body: { data } }
})

const DEFAULT_LIFETIME_MIN = 10

/** 다시 요청: the same card asked again with the same lifetime, unless the user wrote since. */
mock('POST', 'bots/:id/approvals/:approvalId/retry', ({ params }) => {
  const f = fixtureOf(params.id!)
  const card = f && cardOf(f, params.approvalId!)
  if (!f || !card) return notFound()
  const now = new Date()
  const asked = atOf(card.at, now)
  if (f.messages.some((m) => atOf(m.at, now) > asked)) return error(409, 'APPROVAL_SUPERSEDED', 'a newer message exists')
  const lifetime = card.expiresAt === null ? DEFAULT_LIFETIME_MIN * 60_000 : atOf(card.expiresAt, now).getTime() - asked.getTime()
  card.at = now.toISOString()
  card.expiresAt = new Date(now.getTime() + lifetime).toISOString()
  card.status = 'PENDING'
  const data: BotContract.CardRetry = { id: card.id, status: 'PENDING', openedAt: card.at, expiresAt: card.expiresAt }
  return { data }
})
