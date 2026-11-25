import type { BotContract } from '@push/api-client'
import { atOf, consentRequired, fixtureOf, nextId, notFound, type BotFixture, type MockCard, type MockMessage } from './bots'
import { PAGE_READ_TRIGGER, pageReadCard, pageReadFrames } from './bot-scripts/cards'
import { storedCardSurface } from './bot-scripts/surfaces'
import { PROFILE_CHANGE_HEADLINE } from './bot-scripts/runs'
import { hasReferenceConsent } from './chat-state'
import { findMaterial } from './materials'
import { readsMyFiles } from './me'
import { postings } from './postings'
import { mock } from './server'

type TurnEvent = BotContract.TurnEvent
type Unstamped = TurnEvent extends infer E ? (E extends unknown ? Omit<E, 'seq' | 'at'> : never) : never
type Frame = BotContract.StreamEvent

const REPLY = '정리했어요. 더 필요한 게 있으면 말해 주세요.'
const error = (status: number, code: string, message: string, details?: Record<string, unknown>) => ({ status, body: { error: { code, message, details } } })

const cardEvent = (c: MockCard, now: Date): Unstamped => {
  const closed = c.status === 'PENDING' && c.expiresAt !== null && atOf(c.expiresAt, now) <= now
  return storedCardSurface(c, c.status === 'PENDING' && !closed)
}

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
    if (bot?.changeId) events.push(stamp({ type: 'tool', name: 'update_my_profile', state: 'ok', summary: '프로필 수정', result: { headline: PROFILE_CHANGE_HEADLINE, changeId: bot.changeId } }, bot.at))
    if (bot) events.push(stamp({ type: 'token', text: bot.text }, bot.at))
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
  const next = start + limit < newestFirst.length ? String(start + limit) : f.older && start === 0 ? String(limit) : null
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
    .flatMap((m) => [...(m.sources ?? []).filter((x) => x.title.toLowerCase().includes(q)).map(() => m), ...m.text.toLowerCase().split(q).slice(1).map(() => m)])
    .map((m) => ({ messageId: m.id, turnId: m.turn, at: atOf(m.at, now).toISOString() }))
    .sort((a, b) => b.at.localeCompare(a.at))
  const data: BotContract.TranscriptMatches = { total: items.length, items: items.slice(0, 200) }
  return { data }
})

const SEND_FIELDS = ['text', 'attachments', 'intent', 'accessMode', 'ai']
const MAX_ATTACHMENTS = 10

const attachable = (ref: BotContract.AttachmentRef) =>
  findMaterial(ref.kind, ref.id) ?? (ref.kind === 'posting' ? postings.find((p) => p.id === ref.id) : undefined)

mock('POST', 'bots/:id/messages/stream', ({ params, body }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  if (!hasReferenceConsent()) return consentRequired()
  if (!readsMyFiles()) return error(403, 'FILES_READ_OFF', 'reading my files is off')
  const b = (body ?? {}) as Partial<BotContract.SendBody>
  const extra = Object.keys(b).find((k) => !SEND_FIELDS.includes(k))
  if (extra) return error(400, 'VALIDATION_ERROR', 'unknown field', { field: extra })
  const text = typeof b.text === 'string' ? b.text.trim() : ''
  if (!text || text.length > 20_000) return error(400, 'VALIDATION_ERROR', 'text must be 1-20000 characters', { field: 'text' })
  if ((b.attachments ?? []).length > MAX_ATTACHMENTS) return error(400, 'VALIDATION_ERROR', `at most ${MAX_ATTACHMENTS} attachments`, { field: 'attachments' })
  const attachments: BotContract.Attachment[] = []
  for (const ref of b.attachments ?? []) {
    const m = attachable(ref)
    if (!m) return error(409, 'ATTACHMENT_GONE', 'an attached material is gone', { kind: ref.kind, id: ref.id })
    attachments.push({ kind: ref.kind, id: ref.id, title: m.title })
  }
  const turn = nextId('t')
  const now = new Date().toISOString()
  f.messages.push({ id: nextId('m'), turn, role: 'USER', text, at: now, attachments })
  if (text.includes(PAGE_READ_TRIGGER)) {
    const when = new Date(now)
    const card = pageReadCard(nextId('card'), turn, f.bot.companyName ?? f.bot.displayName, 'careers.example.com', when)
    f.cards.push(card)
    return sse(pageReadFrames(card, turn, when, 0))
  }
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

const ANSWER_FIELDS = ['optionId', 'optionIds']

mock('POST', 'bots/:id/approvals/:approvalId', ({ params, body }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  if (!hasReferenceConsent()) return consentRequired()
  const b = (body ?? {}) as { optionId?: string; optionIds?: string[] }
  const extra = Object.keys(b).find((k) => !ANSWER_FIELDS.includes(k))
  if (extra) return error(400, 'VALIDATION_ERROR', 'unknown field', { field: extra })
  const card = cardOf(f, params.approvalId!)
  if (!card) return notFound()
  const optionId = b.optionId ?? b.optionIds?.[0]
  if (!optionId || !card.options.some((o) => o.id === optionId)) return error(400, 'VALIDATION_ERROR', 'unknown option', { field: 'optionId' })
  const now = new Date()
  const expired = card.status === 'PENDING' && card.expiresAt !== null && atOf(card.expiresAt, now) <= now
  if (expired && optionId === 'reject') {
    card.status = 'REJECTED'
    const closed: BotContract.CardAnswer = { id: card.id, status: 'REJECTED', optionId }
    return { data: closed }
  }
  if (expired) return error(410, 'APPROVAL_EXPIRED', 'the card expired')
  if (card.status !== 'PENDING') return error(409, 'APPROVAL_ALREADY_RESOLVED', 'the card was answered')
  card.status = card.for === 'confirm' && optionId === 'reject' ? 'REJECTED' : 'APPROVED'
  const data: BotContract.CardAnswer = { id: card.id, status: card.status, optionId }
  return { status: 202, body: { data } }
})

const DEFAULT_LIFETIME_MIN = 10

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
