// Mock of the /bots routes of push-be, with the same paths and bodies. Fixtures come from the board text of design
// version 396: AgentHome, AgentHomeLong, AgentHomeSearch, BotProfile*, BotNewLinkOk, BotNewLimit.
import type { BotContract } from '@push/api-client'
import { BOT_COLORS } from '../features/bots/constants'
import { hasReferenceConsent } from './chat'
import { postings } from './postings'
import { mock } from './server'

/** Minutes before the request (so "10분 전" and "방금" hold in a capture), or a fixed instant ("10월 28일"). */
export type When = number | string
export const atOf = (when: When, now: Date) => (typeof when === 'number' ? new Date(now.getTime() - when * 60_000) : new Date(when))

export type MockMessage = {
  id: string
  turn: string
  role: 'USER' | 'ASSISTANT'
  text: string
  at: When
  attachments?: BotContract.Attachment[]
  sources?: BotContract.Attachment[]
}

/** `answer` is a choice the user picks, `confirm` an approval. `expiresAt` null never expires. */
export type MockCard = {
  id: string
  turn: string
  for: 'answer' | 'confirm'
  title: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  at: When
  expiresAt: When | null
  options: { id: string; label: string; desc?: string }[]
  summary?: string
}

/** An active chat job. A status without a phase is one an older AI service wrote. */
export type MockJob = { turn: string; at: When; status: 'QUEUED' | 'RUNNING'; statuses: { phase?: 'queued' | 'thinking' | 'working'; text: string }[] }

/** Everything the mock knows about one bot: its row, its profile facts, and its thread. Derived fields are never stored. */
export type BotFixture = {
  bot: Pick<BotContract.Bot, 'id' | 'kind' | 'displayName' | 'companyName' | 'color' | 'postingId' | 'notificationsMuted' | 'revision'> & { createdAt: When }
  /** `deadlineIn` counts days from today, so a D-day label holds in a capture. */
  // shortcut: materialCount is the profile board's number, not counted from GET /materials?bot= as the server does. Only
  // 모아페이 draws both and they agree; count it there once a board draws another bot's materials.
  detail: { posting: { id: string; title: string; deadlineIn: number | null; closed: boolean } | null; fit: { score: number } | null; materialCount?: number }
  readAt: When | null
  /** Oldest first. */
  messages: MockMessage[]
  cards: MockCard[]
  job: MockJob | null
  /** When the bot's newest run failed. A run, message or card after it replaces the outcome. */
  failedAt?: When
}

const newest = <T>(items: T[], time: (item: T) => number) => items.reduce<T | undefined>((a, b) => (a === undefined || time(b) >= time(a) ? b : a), undefined)

/** The card the view calls open: pending and not past its time. */
export const openCardOf = (f: BotFixture, now: Date) =>
  newest(
    f.cards.filter((c) => c.status === 'PENDING' && (c.expiresAt === null || atOf(c.expiresAt, now) > now)),
    (c) => atOf(c.at, now).getTime(),
  )

/**
 * The bot as GET /bots answers it, by the rules of push-be's view bot_state_v (db/migrations/0054_bot_state.sql).
 * It is a second copy of those rules, so both run the named cases of contract.md section 7.
 */
export const botDtoOf = (f: BotFixture, now: Date, all: readonly BotFixture[] = [f]): BotContract.Bot => {
  const time = (w: When) => atOf(w, now).getTime()
  const card = openCardOf(f, now)
  const last = newest(f.messages, (m) => time(m.at))
  const said = Math.max(...f.messages.filter((m) => m.role === 'ASSISTANT').map((m) => time(m.at)), ...f.cards.map((c) => time(c.at)))
  const iso = (w: When) => atOf(w, now).toISOString()
  return {
    ...f.bot,
    createdAt: iso(f.bot.createdAt),
    lastActivityAt: new Date(Math.max(time(f.bot.createdAt), last ? time(last.at) : -Infinity, card ? time(card.at) : -Infinity)).toISOString(),
    lastMessage: last ? { preview: last.text.slice(0, 140), at: iso(last.at), fromBot: last.role === 'ASSISTANT' } : null,
    unread: Number.isFinite(said) && (f.readAt === null || said > time(f.readAt)),
    activity: activityOf(f, now, all),
    outcome: outcomeOf(f, now),
  }
}

/** The server's bot_outcome rule: nothing runs, no card is open, and the newest ending is not older than the newest thing said or asked. */
const outcomeOf = (f: BotFixture, now: Date): BotContract.BotOutcome | null => {
  if (f.job || openCardOf(f, now)) return null
  const time = (w: When) => atOf(w, now).getTime()
  const ended: { kind: 'expired' | 'failed'; at: number }[] = [
    ...f.cards.filter((c) => c.status === 'PENDING' && c.expiresAt !== null).map((c) => ({ kind: 'expired' as const, at: time(c.expiresAt!) })),
    ...(f.failedAt === undefined ? [] : [{ kind: 'failed' as const, at: time(f.failedAt) }]),
  ]
  const outcome = newest(ended, (e) => e.at)
  if (!outcome) return null
  const later = [...f.messages.map((m) => m.at), ...f.cards.map((c) => c.at)].some((w) => time(w) > outcome.at)
  return later ? null : { kind: outcome.kind, at: new Date(outcome.at).toISOString() }
}

const activityOf = (f: BotFixture, now: Date, all: readonly BotFixture[]): BotContract.BotActivity | null => {
  const card = openCardOf(f, now)
  if (card) {
    const expiresAt = card.expiresAt === null ? null : atOf(card.expiresAt, now).toISOString()
    return { phase: 'waiting', since: atOf(card.at, now).toISOString(), for: card.for, cardId: card.id, cardTitle: card.title, expiresAt }
  }
  const job = f.job
  if (!job) return null
  const since = atOf(job.at, now).toISOString()
  if (job.status === 'QUEUED') {
    const started = atOf(job.at, now).getTime()
    const ahead = all.filter((o) => o.job && o !== f && atOf(o.job.at, now).getTime() < started).length
    return { phase: 'queued', since, ahead }
  }
  const phase = [...job.statuses].reverse().find((s) => s.phase)
  if (phase?.phase === 'working') return { phase: 'working', since, label: phase.text }
  const label = [...job.statuses].reverse().find((s) => s.phase === 'working')?.text ?? null
  return { phase: 'thinking', since, label }
}

// ---------- fixtures ----------

const DAY_MIN = 24 * 60

const pushBot = (over: Partial<BotFixture> = {}): BotFixture => ({
  bot: { id: 'b-push', kind: 'push', displayName: 'Push Bot', companyName: '', color: null, postingId: null, notificationsMuted: false, revision: 1, createdAt: '2026-09-01T00:00:00Z' },
  detail: { posting: null, fit: null, materialCount: 23 },
  readAt: 2 * DAY_MIN,
  messages: [
    { id: 'm-push-1', turn: 't-push-1', role: 'USER', text: '이번 주에 마감되는 공고 알려 줘', at: DAY_MIN + 1 },
    { id: 'm-push-2', turn: 't-push-1', role: 'ASSISTANT', text: '모아페이 공고 마감이 이번 주 금요일이에요', at: DAY_MIN },
  ],
  cards: [],
  job: null,
  ...over,
})

type Company = { id: string; name: string; color: BotContract.BotColor; postingId: string | null; companyName?: string; createdAt?: When }
const company = (c: Company, over: Partial<BotFixture>): BotFixture => ({
  bot: {
    id: c.id, kind: 'company', displayName: c.name, companyName: c.companyName ?? c.name, color: c.color, postingId: c.postingId,
    notificationsMuted: false, revision: 1, createdAt: c.createdAt ?? '2026-09-15T00:00:00Z',
  },
  detail: { posting: null, fit: null, materialCount: 8 },
  readAt: null,
  messages: [],
  cards: [],
  job: null,
  ...over,
})

const said = (id: string, turn: string, text: string, at: When, role: MockMessage['role'] = 'ASSISTANT'): MockMessage => ({ id, turn, role, text, at })

const MOA_POSTING = { id: 'p1', title: '백엔드 엔지니어', deadlineIn: 11, closed: false }

/** AgentHome, row for row. GET /bots orders them by last activity, as the board does. */
const home = (): BotFixture[] => [
  pushBot(),
  company(
    { id: 'b-moa', name: '모아페이', color: 'teal', postingId: 'p1' },
    {
      detail: { posting: MOA_POSTING, fit: { score: 8.1 }, materialCount: 8 },
      readAt: 30,
      // AgentHomeSearch finds no message of this chat for "모아", so its text leaves the company name out.
      messages: [said('m-moa-1', 't-moa-2', '좋아요. 첫 번째부터 고쳐서 PDF로 보여 주세요', 12, 'USER')],
      cards: [
        {
          id: 'card-moa-edit', turn: 't-moa-2', for: 'confirm', title: '이 변경을 이력서에 반영할까요?', status: 'PENDING', at: 10, expiresAt: null,
          options: [{ id: 'approve', label: '반영하기' }, { id: 'reject', label: '그대로 두기' }],
        },
      ],
    },
  ),
  company(
    { id: 'b-dotori', name: '도토리증권', color: 'amber', postingId: 'p3' },
    {
      detail: { posting: { id: 'p3', title: '서버 개발자', deadlineIn: 3, closed: false }, fit: { score: 7.2 }, materialCount: 5 },
      readAt: 60,
      messages: [
        said('m-dotori-1', 't-dotori-1', '도토리증권 서버 개발자 공고 요건을 읽고, 그동안의 모아페이 경력과 겹치는 부분을 정리했어요', 61),
        said('m-dotori-2', 't-dotori-2', '경력 섹션도 공고에 맞게 고쳐 줘', 60, 'USER'),
      ],
      job: { turn: 't-dotori-2', at: 60, status: 'RUNNING', statuses: [{ phase: 'queued', text: '대기 중' }, { phase: 'thinking', text: '생각 중' }, { phase: 'working', text: '경력 섹션 고치는 중' }] },
    },
  ),
  company(
    { id: 'b-pado', name: '파도AI', color: 'sky', postingId: 'p14' },
    {
      detail: { posting: { id: 'p14', title: 'ML 플랫폼 엔지니어', deadlineIn: null, closed: false }, fit: null, materialCount: 2 },
      readAt: 0,
      messages: [said('m-pado-1', 't-pado-1', '파도AI 공고에 맞춰 지원 동기를 써 줘', 0, 'USER')],
      job: {
        turn: 't-pado-1', at: 0, status: 'RUNNING',
        statuses: [{ phase: 'queued', text: '대기 중' }, { phase: 'working', text: '공고 요건을 살펴보는 중' }, { phase: 'thinking', text: '생각 중' }],
      },
    },
  ),
  company(
    { id: 'b-nuri', name: '누리클라우드', color: 'pink', postingId: 'p9' },
    {
      detail: { posting: { id: 'p9', title: '플랫폼 엔지니어', deadlineIn: null, closed: false }, fit: { score: 7.4 }, materialCount: 8 },
      readAt: 2 * DAY_MIN,
      messages: [
        said('m-nuri-1', 't-nuri-1', '자기소개서 초안을 한 번 더 다듬어 줘', DAY_MIN + 30, 'USER'),
        said('m-nuri-2', 't-nuri-1', '자기소개서 초안 v2를 만들었어요', DAY_MIN + 20),
      ],
    },
  ),
  company(
    { id: 'b-hanbit', name: '한빛모빌리티', color: 'coral', postingId: null },
    {
      readAt: '2026-10-28T06:00:00Z',
      messages: [said('m-hanbit-1', 't-hanbit-1', '면접 예상 질문 12개를 정리했어요', '2026-10-28T05:00:00Z')],
    },
  ),
  company(
    { id: 'b-sodam', name: '소담헬스', color: 'green', postingId: null },
    {
      readAt: '2026-10-24T06:00:00Z',
      messages: [said('m-sodam-1', 't-sodam-1', '지원 동기 문단을 줄였어요', '2026-10-24T05:00:00Z')],
    },
  ),
]

/** AgentHomeRowExpiredFailed: AgentHome with 모아페이 asking a card that ran out and 도토리증권 ending a run in failure. */
const homeOutcome = (): BotFixture[] => {
  const [push, ...rest] = home()
  const moa = rest.find((f) => f.bot.id === 'b-moa')!
  const dotori = rest.find((f) => f.bot.id === 'b-dotori')!
  moa.cards = [{ ...moa.cards[0]!, id: 'card-moa-out', at: 20, expiresAt: 10 }]
  dotori.job = null
  dotori.failedAt = 60
  return [push!, ...rest]
}

/** AgentHomeLong, row for row. Also the long names of BotProfileLong and ChatBotHeaderLong. */
const homeLong = (): BotFixture[] => [
  pushBot(),
  company(
    { id: 'b-nuri', name: '누리클라우드 플랫폼엔지니어링코리아 판교캠퍼스 유한회사', color: 'pink', postingId: 'p9' },
    {
      detail: { posting: { id: 'p9', title: '플랫폼 엔지니어', deadlineIn: null, closed: false }, fit: { score: 7.4 }, materialCount: 8 },
      readAt: 60,
      messages: [said('m-nuri-l1', 't-nuri-l1', '경력 섹션을 공고 필수 요건에 맞춰 다시 써 줘', 60, 'USER')],
      job: {
        turn: 't-nuri-l1', at: 60, status: 'RUNNING',
        statuses: [{ phase: 'working', text: '경력 섹션에서 결제 승인 API 재설계 경험을 공고 필수 요건인 대용량 트래픽 처리 경험과 연결해서 다시 쓰는 중이에요' }],
      },
    },
  ),
  company(
    { id: 'b-hanbit', name: '한빛모빌리티 자율주행 데이터플랫폼팀', color: 'coral', postingId: null },
    {
      readAt: 30,
      messages: [said('m-hanbit-l1', 't-hanbit-l1', '지원 동기 문단을 써 줘', 12, 'USER')],
      cards: [
        {
          id: 'card-hanbit-pick', turn: 't-hanbit-l1', for: 'answer', status: 'PENDING', at: 10, expiresAt: null,
          title: '지원 동기 문단을 두 가지 버전으로 만들었어요. 제품 관점과 데이터 관점 중 어느 쪽으로 갈지 골라 주세요',
          options: [{ id: 'product', label: '제품 관점' }, { id: 'data', label: '데이터 관점' }],
        },
      ],
    },
  ),
  company(
    { id: 'b-moa', name: '모아페이', color: 'teal', postingId: 'p1' },
    {
      detail: { posting: MOA_POSTING, fit: { score: 8.1 }, materialCount: 8 },
      readAt: 2 * DAY_MIN,
      messages: [said('m-moa-l1', 't-moa-l1', '자기소개서 4개 문항을 모두 글자 수 안으로 맞췄고, 맞춤법과 띄어쓰기까지 확인했어요', DAY_MIN + 10)],
    },
  ),
  home()[3]!,
  company(
    { id: 'b-sodam', name: '소담헬스케어 디지털헬스연구소', color: 'green', postingId: null },
    {
      readAt: '2025-12-03T06:00:00Z',
      messages: [said('m-sodam-l1', 't-sodam-l1', '면접 예상 질문 12개를 정리했어요', '2025-12-03T05:00:00Z')],
    },
  ),
]

type Plan = BotContract.BotLimit['plan']
const LIMITS: BotContract.BotLimit['table'] = { FREE: 3, PRO: 20, ULTRA: null }

let fixtures: BotFixture[] = home()
let plan: Plan = 'PRO'
let seq = 0

type SiteGrant = { host: string; kind: 'posting' | 'company' | 'other'; grantedAt: string }

const grantSeed = (): Record<string, SiteGrant[]> => ({
  'b-moa': [
    { host: 'careers.moapay.co.kr', kind: 'posting', grantedAt: '2026-11-03' },
    { host: 'moapay.notion.site', kind: 'company', grantedAt: '2026-11-05' },
  ],
  'b-push': [
    { host: 'careers.moapay.co.kr', kind: 'posting', grantedAt: '2026-11-03' },
    { host: 'nuricloud.career.greetinghr.com', kind: 'posting', grantedAt: '2026-10-29' },
  ],
})

let grants = grantSeed()
export const nextId = (prefix: string) => `${prefix}-${++seq}`

/** Tour switches (links.ts). */
export const setBots = (set: 'home' | 'none' | 'long' | 'outcome') => {
  fixtures = set === 'long' ? homeLong() : set === 'outcome' ? homeOutcome() : set === 'none' ? [pushBot({ messages: [], readAt: null })] : home()
}
export const setBotPlan = (next: Plan) => {
  plan = next
}
export const muteBot = (id: string) => {
  const f = fixtureOf(id)
  if (f) f.bot.notificationsMuted = true
}
/** ChatBotStatusExpired: 모아페이 asks to open a page and the 10 minutes run out. */
export const expireCard = () => {
  const f = fixtureOf('b-moa')
  if (!f) return
  f.cards = [
    {
      id: 'card-moa-page', turn: 't-moa-2', for: 'confirm', title: '모아페이 채용 페이지를 열어도 될까요?', status: 'PENDING', at: 11, expiresAt: 1,
      summary: 'careers.moapay.co.kr · 공고 1개를 읽어요',
      options: [{ id: 'approve', label: '한 번 허용' }, { id: 'approve_always', label: '항상 허용', desc: '이 봇이 이 사이트를 읽을 때 다시 묻지 않아요' }, { id: 'reject', label: '거절' }],
    },
  ]
}
export const resetBots = () => {
  setBots('home')
  plan = 'PRO'
  grants = grantSeed()
}

export const fixturesNow = () => fixtures
/** A bot by id, or `push` for the Push Bot, as every /bots/{id} route reads its address. */
export const fixtureOf = (address: string) => fixtures.find((f) => (address === 'push' ? f.bot.kind === 'push' : f.bot.id === address))

// ---------- routes ----------

const error = (status: number, code: string, message: string, details?: Record<string, unknown>) => ({ status, body: { error: { code, message, details } } })
export const notFound = () => error(404, 'NOT_FOUND', 'resource not found')
/** Creating a bot, sending to one, and answering its card all start AI work, which needs 참고 데이터 제공. */
export const consentRequired = () => error(403, 'CONSENT_REQUIRED', 'reference data consent is required')
const invalid = (field: string, message: string) => error(400, 'VALIDATION_ERROR', message, { field })
const blankName = (b: Record<string, unknown>) => typeof b.displayName === 'string' && !b.displayName.trim()

const dto = (f: BotFixture, now = new Date()) => botDtoOf(f, now, fixtures)

/** push-be's list order: the Push Bot, then the company bots by last activity, newest first. */
const inListOrder = (now: Date) => {
  const rank = new Map(fixtures.map((f) => [f, f.bot.kind === 'push' ? Infinity : Date.parse(dto(f, now).lastActivityAt)]))
  return [...fixtures].sort((a, b) => rank.get(b)! - rank.get(a)!)
}

const dayIn = (days: number, now: Date) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const detailOf = (f: BotFixture): BotContract.BotDetail => {
  const now = new Date()
  const p = f.detail.posting
  return {
    ...dto(f, now),
    posting: p && { id: p.id, title: p.title, deadline: p.deadlineIn === null ? null : dayIn(p.deadlineIn, now), closed: p.closed },
    fit: f.detail.fit,
    ...(f.detail.materialCount === undefined ? {} : { materialCount: f.detail.materialCount }),
  }
}

const companyKey = (name: string) => name.trim().toLowerCase()
const companyBotOf = (name: string) => fixtures.find((f) => f.bot.kind === 'company' && companyKey(f.bot.companyName) === companyKey(name))

mock('GET', 'bots', ({ query }) => {
  const postingId = query.get('postingId')
  if (postingId !== null) {
    const posting = postings.find((p) => p.id === postingId)
    const found = posting && companyBotOf(posting.company)
    const data: BotContract.Bot[] = found ? [dto(found)] : []
    return { data }
  }
  const now = new Date()
  const used = fixtures.filter((f) => f.bot.kind === 'company').length
  const body: BotContract.BotList = { data: inListOrder(now).map((f) => dto(f, now)), limit: { plan, max: LIMITS[plan], used, table: LIMITS } }
  return body
})

const CREATE_FIELDS = ['postingId', 'displayName', 'color']

mock('POST', 'bots', ({ body }) => {
  const b = (body ?? {}) as Record<string, unknown>
  const extra = Object.keys(b).find((k) => !CREATE_FIELDS.includes(k))
  if (extra) return invalid(extra, 'unknown field')
  const color = b.color ?? 'teal'
  if (!BOT_COLORS.some((c) => c === color)) return invalid('color', `must be one of ${BOT_COLORS.join(', ')}`)
  if (blankName(b)) return invalid('displayName', 'must not be blank')
  if (!hasReferenceConsent()) return consentRequired()
  const posting = postings.find((p) => p.id === b.postingId)
  if (!posting) return notFound()
  const existing = companyBotOf(posting.company)
  if (existing) return { status: 200, body: { data: dto(existing) } }
  const max = LIMITS[plan]
  const used = fixtures.filter((f) => f.bot.kind === 'company').length
  if (max !== null && used >= max) return error(403, 'BOT_LIMIT', 'company bot limit reached for your plan', { limit: max, plan })
  const name = typeof b.displayName === 'string' ? b.displayName.trim() : posting.company
  const made = company(
    { id: nextId('b'), name, companyName: posting.company, color: color as BotContract.BotColor, postingId: posting.id, createdAt: new Date().toISOString() },
    { detail: { posting: { id: posting.id, title: posting.title, deadlineIn: null, closed: false }, fit: null, materialCount: 0 } },
  )
  fixtures = [...fixtures, made]
  return { status: 201, body: { data: dto(made) } }
})

// The lookup of a posting by its link answers only postings Push has. BotNewLinkOk draws this one.
const LINKED: Record<string, Omit<Extract<BotContract.LinkPreview, { status: 'found' }>, 'status' | 'host' | 'deadline'> & { deadlineIn: number }> = {
  'careers.moapay.co.kr/jobs/1042': { postingId: 'p1', company: '모아페이', title: '백엔드 엔지니어', deadlineIn: 11, careerMin: 3, careerMax: null, location: '서울' },
}

const canon = (url: URL) => `${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, '')}`

mock('POST', 'bots/link-preview', ({ body }) => {
  const raw = (body as { url?: unknown } | undefined)?.url
  let url: URL
  try {
    url = new URL(String(raw))
  } catch {
    return invalid('url', 'must be an http(s) URL without credentials')
  }
  if (!/^https?:$/.test(url.protocol)) return invalid('url', 'must be an http(s) URL without credentials')
  const key = canon(url)
  const now = new Date()
  const linked = LINKED[key]
  if (linked) {
    const { deadlineIn, ...rest } = linked
    return { data: { status: 'found', ...rest, deadline: dayIn(deadlineIn, now), host: url.hostname } satisfies BotContract.LinkPreview }
  }
  const posting = postings.find((p) => p.sourceUrl && canon(new URL(p.sourceUrl)) === key)
  if (!posting) return { data: { status: 'not_a_posting' } satisfies BotContract.LinkPreview }
  const found: BotContract.LinkPreview = {
    status: 'found', postingId: posting.id, company: posting.company, title: posting.title, deadline: posting.deadline,
    careerMin: posting.careerMin, careerMax: posting.careerMax, location: posting.location || null, host: url.hostname,
  }
  return { data: found }
})

const SNIPPET = { before: 30, after: 60 }

/** push-be's snippetOf: up to 30 characters before the hit and 60 after, with a leading … when cut. */
export const snippetOf = (text: string, q: string) => {
  const chars = [...text]
  const found = text.toLowerCase().indexOf(q.toLowerCase())
  const at = found < 0 ? 0 : [...text.slice(0, found)].length
  const start = Math.max(0, at - SNIPPET.before)
  return (start > 0 ? '…' : '') + chars.slice(start, at + (found < 0 ? 0 : [...q].length) + SNIPPET.after).join('')
}

mock('GET', 'bots/search', ({ query }) => {
  const q = (query.get('q') ?? '').trim()
  if (!q || [...q].length > 200) return invalid('q', 'q must be 1-200 characters')
  const has = (text: string) => text.toLowerCase().includes(q.toLowerCase())
  const now = new Date()
  const bots = inListOrder(now)
    .filter((f) => has(f.bot.displayName) || has(f.bot.companyName) || has(f.detail.posting?.title ?? ''))
    .map((f) => ({ ...dto(f, now), line: f.detail.posting ? `${f.bot.companyName} · ${f.detail.posting.title}` : f.bot.displayName }))
  const hits = fixtures
    .flatMap((f) => f.messages.filter((m) => has(m.text)).map((m) => ({ f, m, at: atOf(m.at, now) })))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
  const limit = Math.min(Number(query.get('limit') ?? 20), 50)
  const start = Number(query.get('cursor') ?? 0)
  const pageHits = hits.slice(start, start + limit)
  const next = start + limit < hits.length ? String(start + limit) : null
  const data: BotContract.BotSearch = {
    bots,
    botTotal: bots.length,
    messages: pageHits.map(({ f, m, at }) => ({
      bot: { id: f.bot.id, kind: f.bot.kind, displayName: f.bot.displayName, color: f.bot.color },
      messageId: m.id,
      at: at.toISOString(),
      role: m.role,
      snippet: snippetOf(m.text, q),
    })),
    messageTotal: hits.length,
  }
  return { data, page: { nextCursor: next, hasMore: next !== null } }
})

mock('GET', 'bots/:id', ({ params }) => {
  const f = fixtureOf(params.id!)
  return f ? { data: detailOf(f) } : notFound()
})

const PATCH_FIELDS = ['expectedRevision', 'displayName', 'notificationsMuted', 'color']

mock('PATCH', 'bots/:id', ({ params, body }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  const b = (body ?? {}) as Record<string, unknown>
  const extra = Object.keys(b).find((k) => !PATCH_FIELDS.includes(k) || (f.bot.kind === 'push' && k !== 'expectedRevision' && k !== 'notificationsMuted'))
  if (extra) return invalid(extra, 'unknown field')
  if (b.color !== undefined && !BOT_COLORS.some((c) => c === b.color)) return invalid('color', `must be one of ${BOT_COLORS.join(', ')}`)
  if (blankName(b)) return invalid('displayName', 'must not be blank')
  if (b.expectedRevision !== f.bot.revision) return error(409, 'REVISION_CONFLICT', 'bot changed', { currentRevision: f.bot.revision })
  f.bot = {
    ...f.bot,
    revision: f.bot.revision + 1,
    ...(typeof b.displayName === 'string' ? { displayName: b.displayName.trim() } : {}),
    ...(typeof b.notificationsMuted === 'boolean' ? { notificationsMuted: b.notificationsMuted } : {}),
    ...(b.color !== undefined ? { color: b.color as BotContract.BotColor } : {}),
  }
  return { data: dto(f) }
})

mock('DELETE', 'bots/:id', ({ params }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  if (f.bot.kind === 'push') return error(403, 'DEFAULT_BOT_PROTECTED', 'the Push Bot cannot be deleted')
  fixtures = fixtures.filter((x) => x !== f)
  return undefined
})

mock('POST', 'bots/:id/read', ({ params }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  const readAt = new Date().toISOString()
  f.readAt = readAt
  return { data: { readAt } }
})

/** Clear chat: the thread goes, the bot and its settings stay. */
mock('DELETE', 'bots/:id/transcript', ({ params }) => {
  const f = fixtureOf(params.id!)
  if (!f) return notFound()
  Object.assign(f, { messages: [], cards: [], job: null })
  return undefined
})

const grantsOf = (address: string) => {
  const id = fixtureOf(address)?.bot.id
  if (!id) return null
  return [...(grants[id] ?? [])].sort((a, b) => a.host.localeCompare(b.host))
}

mock('GET', 'bots/:id/site-grants', ({ params }) => {
  const data = grantsOf(params.id!)
  return data ? { data } : notFound()
})

mock('DELETE', 'bots/:id/site-grants/:host', ({ params }) => {
  const id = fixtureOf(params.id!)?.bot.id
  if (!id) return notFound()
  grants[id] = (grants[id] ?? []).filter((grant) => grant.host !== params.host)
  return undefined
})
