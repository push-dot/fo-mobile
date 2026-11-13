// Mock routes for the chat area. Owned by that area's screens.
// Sample data follows the AI 채팅 artboards (김서준, 모아페이 …).
import type { ConversationTurn, LinkKind, Message, UserLink } from '@push/api-client'
import type { ChatDoc, ConversationRow, QsData, RunInput, Step } from '@/features/chat'
import { kindOf } from '../features/chat/utils/links'
import { mapEvent } from '../features/chat/utils/stream'
import { fail, generic, JD_LINES, MOA, next, PH1, pick, PROFILE_TASK, PROFILE_TODO, RESUME, startDocument, tailorResume, TODO, TODO_PLUS, verifyFail } from './bot-scripts/runs'
import { mock, page } from './server'
import { LEGAL_VERSION } from '@push/shared'

type Terms = { version: string; age14At: string | null; serviceTermsAt: string | null; privacyAt: string | null; marketing: boolean; marketingAt: string | null }

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

// ---------- conversations ----------

const conv = (id: string, title: string, min: number, lastLine: string, status: ConversationRow['status'] = null, at?: string): ConversationRow => ({
  id,
  revision: 1,
  applicationId: null,
  title,
  pinned: false,
  createdAt: at ?? ago(min + 30),
  updatedAt: at ?? ago(min),
  status,
  lastLine,
})

const conversations: ConversationRow[] = [
  { ...conv('c-moa', '모아페이 백엔드 이력서', 10, '이 변경을 이력서에 반영할까요?', 'NEEDS_APPROVAL'), company: '모아페이' },
  // ChatResume opens this one and draws 모아페이 in the header pill.
  { ...conv('c-dotori', '도토리증권 공고 갭 분석', 60, '경력 섹션 고치는 중', 'RUNNING'), company: '모아페이' },
  // ChatListPress draws this row pinned.
  { ...conv('c-career', '경력기술서 다듬기', 60 * 30, 'PDF로 저장했어요 · 적합도 8.2'), pinned: true },
  // The design lists these two under 이번 주, so keep them inside the last six days whatever day the tour runs.
  conv('c-pado', '파도AI 자기소개서 초안', 3 * 24 * 60, '초안 v1을 만들었어요'),
  conv('c-nuri', '누리클라우드 자기소개서', 5 * 24 * 60, '지원 동기 문단을 줄였어요'),
  conv('a-toss', '토스 백엔드 이력서', 0, '적합도 7.4 · PDF로 저장했어요', null, '2026-09-28T03:00:00.000Z'),
  conv('a-line', '라인 커버레터 초안', 0, '초안 v2를 만들었어요', null, '2026-09-14T03:00:00.000Z'),
  conv('a-baemin', '배민 공고 갭 분석', 0, '경력 섹션을 고쳤어요', null, '2026-08-30T03:00:00.000Z'),
]
const archived = new Set(['a-toss', 'a-line', 'a-baemin'])
let referenceData = false
// Tour switch (links.ts): the 설정 boards draw 참고 데이터 제공 on; the mock starts it off so the chat asks first.
export const grantReference = () => {
  referenceData = true
}
export const hasReferenceConsent = () => referenceData
const byRecent = (rows: ConversationRow[]) => rows.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
const live = () => byRecent(conversations.filter((c) => !archived.has(c.id)))
const find = (id: string) => conversations.find((c) => c.id === id)

mock('GET', 'conversations', ({ query }) =>
  page(query.get('archived') === 'true' ? byRecent(conversations.filter((c) => archived.has(c.id))) : live(), query),
)
mock('POST', 'conversations', ({ body }) => {
  if (!referenceData) return { status: 403, body: { error: { code: 'CONSENT_REQUIRED', message: 'consent' } } }
  const b = body as { title: string }
  // Every scenario targets the 모아페이 posting except the upload without one (ChatDoneNoJob) and the read failure (ChatErrors).
  const c = { ...conv(`c-${Date.now()}`, b.title.slice(0, 300), 0, ''), company: /^(ext-nojob|fail|no-posting|이 서류를 고쳐 줘)$/i.test(b.title.trim()) ? null : '모아페이' }
  conversations.push(c)
  return { status: 201, body: { data: c } }
})
mock('GET', 'conversations/:id', ({ params }) => {
  const c = find(params.id!)
  return c ? { data: c } : { status: 404, body: { error: { code: 'NOT_FOUND', message: 'conversation' } } }
})
mock('PATCH', 'conversations/:id', ({ params, body }) => {
  const c = find(params.id!)
  if (!c) return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'conversation' } } }
  const b = body as { title?: string; pinned?: boolean }
  Object.assign(c, { title: b.title ?? c.title, pinned: b.pinned ?? c.pinned, revision: c.revision + 1 })
  return { data: c }
})
mock('POST', 'conversations/:id/archive', ({ params }) => {
  archived.add(params.id!)
  return { data: find(params.id!) }
})
mock('POST', 'conversations/:id/unarchive', ({ params }) => {
  archived.delete(params.id!)
  return { data: find(params.id!) }
})
mock('DELETE', 'conversations/:id', ({ params }) => {
  const i = conversations.findIndex((c) => c.id === params.id)
  if (i >= 0) conversations.splice(i, 1)
  archived.delete(params.id!)
})
// The default signed-in user accepted the required terms, like a real one; phone sign-in of a new user clears them (home.ts) so the 약관 동의 screens stay reachable.
const accepted = () => new Date().toISOString()
const terms: Terms = { version: LEGAL_VERSION, age14At: accepted(), serviceTermsAt: accepted(), privacyAt: accepted(), marketing: false, marketingAt: null }
export const forgetRequiredTerms = () => Object.assign(terms, { age14At: null, serviceTermsAt: null, privacyAt: null })
mock('GET', 'me/consents', () => ({ data: { referenceData, updatedAt: null, terms } }))
mock('PUT', 'me/consents', ({ body }) => {
  referenceData = (body as { referenceData?: boolean }).referenceData === true
  return { data: { referenceData, updatedAt: new Date().toISOString(), terms } }
})
mock('PUT', 'me/consents/terms', ({ body }) => {
  const marketing = (body as { marketing?: boolean }).marketing
  if (typeof marketing === 'boolean') Object.assign(terms, { marketing, marketingAt: new Date().toISOString() })
  return { data: { referenceData, updatedAt: null, terms } }
})
mock('GET', 'conversations/:id/messages', ({ params, query }) => {
  const c = find(params.id!)
  const msgs: Message[] =
    c && c.lastLine
      ? [
          { id: `${c.id}-u`, conversationId: c.id, role: 'USER', text: `${c.title} 부탁해요`, attachments: [], operationId: null, createdAt: c.createdAt },
          { id: `${c.id}-a`, conversationId: c.id, role: 'ASSISTANT', text: c.lastLine, attachments: [], operationId: null, createdAt: c.updatedAt },
        ]
      : []
  // Newest first, like push-be.
  return page(msgs.reverse(), query)
})

// ---------- scripted runs ----------

type Frame = Step['frame']
type Card = Extract<Frame, { type: 'choice' | 'approval' }>

// The scripted run answers QUEUE_BUSY as an error line with the 12s wait: the second 도토리증권 line of ChatStates.4.
const BUSY = new Set(['queue-busy', '도토리증권 공고도 맞춰 줘'])

// Per conversation: id prefix for the current scenario (so continuations update the same lines) and its to-do labels.
const scenario = new Map<string, { prefix: string; labels: string[]; verified?: boolean }>()
/** The card each conversation waits on: the last one its newest run sent. */
const waiting = new Map<string, Card>()
let runs = 0

const isCard = (f: Frame): f is Card => (f.type === 'choice' && !f.auto) || f.type === 'approval'

/** The branch the scripts take for an answer: the option's position, 0 for a section card's submit, -1 for its 그만하기. */
const choiceOf = (card: Card, optionId: string) => (optionId === 'cancel' ? -1 : Math.max(0, card.options.findIndex((o) => o.id === optionId)))

/** Typing while a card is open answers it: a numbered card with its last choice (직접 말하기), a section or edit card with its first. */
const typedChoice = (card: Card) => ((card.type === 'choice' && card.sections?.length) || (card.type === 'approval' && card.kind === 'DOCUMENT_EDIT') ? 0 : card.options.length - 1)

/** Ids of one scenario stay apart from another's in the same conversation, so a new scenario draws its own lines below the old ones. */
const scoped = (f: Frame, prefix: string): Frame => {
  const own = (id: string) => `${prefix}-${id}`
  switch (f.type) {
    case 'tool':
      return { ...f, name: own(f.name) }
    case 'todo':
      return { ...f, id: own(f.id ?? 'todo') }
    case 'paper':
      return { ...f, id: own(f.id) }
    case 'diff':
      return { ...f, revisionId: own(f.revisionId) }
    case 'plan':
      // push-be names a plan by its kind only, so two plans of one conversation share an id without the prefix.
      return { ...f, id: own(f.id) as typeof f.id }
    case 'choice':
      return f.auto ? { ...f, id: own(f.id) } : f
    default:
      return f
  }
}

/** Stamps each frame with the conversation's next seq and remembers the card the run leaves open. */
const serve = (id: string, steps: Step[], prefix?: string): Step[] => {
  let seq = lastSeq.get(id) ?? 0
  const out: Step[] = steps.map((st) => ({ ...st, frame: { ...(prefix ? scoped(st.frame, prefix) : st.frame), seq: ++seq } }))
  lastSeq.set(id, seq)
  const card = out.map((st) => st.frame).findLast(isCard)
  if (card) waiting.set(id, card)
  else waiting.delete(id)
  return out
}

/** A card restored from GET .../turns has no run behind it in the mock, so answering it only closes it. */
const closeStored = (id: string): Step[] => {
  delete storedTurns[id]
  const c = find(id)
  if (c) Object.assign(c, { status: null, lastLine: '' })
  return []
}

// The 도토리증권 chat is one chat under two ids: the legacy row above and the bot (b-dotori) whose job the mock leaves running.
const RESUMABLE_BOT = 'b-dotori'

const script = (b: RunInput, card: Card | undefined, choice: number | undefined): Step[] => {
  const id = b.conversationId
  const state = scenario.get(id)
  if (card && state && choice !== undefined) {
    // The first 병목 강도 pick fails verification (ChatVerifyFail); picking again passes.
    const verifying = card.id === 'ph2x-level' && choice !== 3 && !state.verified
    if (verifying) state.verified = true
    return verifying ? verifyFail : (next[card.id] ?? (() => generic(b.text ?? '')))(choice, state.labels)
  }
  if (!state && (find(id)?.status === 'RUNNING' || id === RESUMABLE_BOT)) {
    scenario.set(id, { prefix: `r${++runs}`, labels: TODO })
    return startDocument
  }
  if (b.interrupted && state && !pick(b.text ?? '', true, undefined, b.intent, account.run)) {
    // Talking after 중지 resumes the stopped work with the new request folded in (ChatInterrupt).
    // Fresh ids: the stopped lines stay in the transcript and the resumed work continues below them.
    scenario.set(id, { prefix: `r${++runs}`, labels: TODO_PLUS })
    return tailorResume
  }
  const p = pick(b.text ?? '', false, b.attachment, b.intent, account.run)!
  scenario.set(id, { prefix: `r${++runs}`, labels: p.labels ?? TODO })
  return p.steps
}

mock('POST', 'chat/runs', ({ body }) => {
  const b = body as RunInput
  const id = b.conversationId
  const card = b.interrupted ? undefined : waiting.get(id)
  if (b.resolve && b.resolve.approvalId !== card?.id) return { data: closeStored(id) }
  const choice = card && (b.resolve ? choiceOf(card, b.resolve.optionId) : typedChoice(card))
  if (BUSY.has((b.text ?? '').trim().toLowerCase())) return { data: serve(id, fail('QUEUE_BUSY', { retryAfterSec: 12 })) }
  if (account.spent && choice === undefined) return { data: serve(id, fail('INSUFFICIENT_CREDITS')) }
  const steps = script(b, card, choice)
  const out = serve(id, steps, scenario.get(id)!.prefix)

  const c = find(id)
  if (c) {
    const events = out.flatMap((st) => mapEvent(st.frame))
    const last = events.at(-1)
    const line = events.findLast((e) => e.type === 'agentText' || e.type === 'token')
    c.status = last?.type === 'approval' ? 'NEEDS_APPROVAL' : null
    c.lastLine = last?.type === 'approval' ? last.approval.question : (line && 'text' in line ? line.text : '').replace(/\*\*/g, '')
    c.updatedAt = new Date().toISOString()
  }
  return { data: out }
})

// ---------- stored turns ----------

// What GET .../turns returns for the seeded conversations, so reopening one draws its cards again.
const storedTurns: Record<string, ConversationTurn['events']> = {
  'c-moa': [
    { type: 'todo', id: 'analyze', items: PH1.map((text, i) => ({ id: String(i), text, state: 'done' as const })), seq: 1 },
    { type: 'tool', name: 'read_resume', state: 'ok', summary: '이력서 읽기', target: RESUME, resultLine: '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개', seq: 2 },
    { type: 'tool', name: 'analyze_posting', state: 'ok', summary: '공고 읽기', target: MOA, resultLine: '필수 5개 · 우대 3개', extra: JD_LINES, seq: 3 },
    { type: 'tool', name: 'fit_score', state: 'ok', summary: '적합도 계산', target: '5개 항목 · 가중치 반영', resultLine: '6.9점', seq: 4 },
    {
      type: 'fit', score: 6.9, plan: 'PRO', band: '보통 · 개선 여지 있어요', summary: '기술 스택은 잘 맞아요. 키워드와 도메인이 약해요.',
      parts: { techStack: 7.5, experienceLink: 7, careerLevel: 8, keyword: 4.5, domain: 5 },
      keywords: [{ label: 'Kotlin', ok: true }, { label: 'Spring Boot', ok: true }, { label: 'JPA', ok: true }, { label: 'Kafka', ok: false }, { label: '정산 도메인', ok: false }],
      seq: 5,
    },
    { type: 'token', text: '경력 섹션부터 공고에 맞게 고쳐 볼게요.', seq: 6 },
    {
      type: 'approval', id: 'moa-edit', kind: 'DOCUMENT_EDIT', title: '이 수정을 적용할까요?', documentId: 'd1',
      options: [{ id: 'apply', label: '적용' }, { id: 'skip', label: '그대로 두기' }],
      hunks: [
        { line: 13, sign: '-', text: '결제 API 개발 및 운영' },
        { line: 13, sign: '+', text: '결제 승인 API를 Kotlin·Spring으로 재설계, p95 응답 320ms → 140ms' },
      ],
      resolution: { status: 'PENDING', optionId: null },
      seq: 7,
    },
  ],
  'c-dotori': [
    { type: 'tool', name: 'write_draft', state: 'ok', summary: '초안 쓰기', target: '이력서 v1', resultLine: '1쪽 · 섹션 5개 · 말투 그대로', seq: 1 },
    {
      type: 'choice', id: 'ph3-review', title: '첫 번째 초안(v1)이에요. 이대로 검토할까요?',
      options: [{ id: 'review', label: '검토할게요' }, { id: 'stop', label: '그만하기' }],
      resolution: { status: 'EXPIRED', optionId: null },
      seq: 2,
    },
  ],
  'c-career': [
    { type: 'todo', items: PROFILE_TODO.map((text, i) => ({ id: String(i), text, state: 'done' as const })), seq: 1 },
    {
      type: 'result', source: 'profile', taskLine: PROFILE_TASK, checklist: PROFILE_TODO, documentId: 'd1', company: '모아페이',
      name: '김서준', headline: '백엔드 엔지니어', title: '김서준 · 백엔드 엔지니어', subtitle: 'Push 프로필 · 어제 수정',
      actions: [{ id: 'apply', label: '모아페이에 바로 지원하기' }, { id: 'view', label: '프로필 보기' }],
      summary: '다 됐어요! 적합도를 6.9 → 8.2로 올렸어요.', fitFrom: 6.9, fitTo: 8.2,
      bullets: ['승인 API 성과를 숫자로 보여 줬어요', 'Kafka를 기술 스택 맨 앞으로 옮겼어요'],
      seq: 2,
    },
  ],
}

/**
 * Each conversation's newest frame seq, starting after its stored turns. push-be numbers every frame from one counter,
 * so a new run never reuses a restored frame's seq, which the mapper turns into ids such as fit-<seq>.
 */
const lastSeq = new Map(Object.entries(storedTurns).map(([id, events]) => [id, Math.max(...events.map((e) => e.seq ?? 0))]))

mock('GET', 'conversations/:id/turns', ({ params, query }) => {
  const c = find(params.id!)
  const events = c && storedTurns[c.id]
  const turns: ConversationTurn[] = events
    ? [{ jobId: `${c.id}-j`, status: 'DONE', createdAt: c.updatedAt, userMessageId: c.id === 'c-dotori' ? null : `${c.id}-u`, assistantMessageId: null, answer: null, events }]
    : []
  return page(turns, query)
})

// ---------- 내 링크 ----------

const links: UserLink[] = [
  { id: 'l1', kind: 'job', url: 'https://careers.moapay.kr/jobs/1182', title: '모아페이 · 결제 플랫폼 시니어 엔지니어', status: 'READ', fitCount: 2, aiRead: true, createdAt: ago(60) },
  { id: 'l2', kind: 'job', url: 'https://nuricloud.career.greetinghr.com', title: '누리클라우드 · 백엔드 개발자', status: 'READ', fitCount: 0, aiRead: true, createdAt: ago(300) },
  { id: 'l3', kind: 'job', url: 'https://wanted.co.kr/wd/231877', title: '그린티켓 · 플랫폼 엔지니어', status: 'READING', fitCount: 0, aiRead: true, createdAt: ago(5) },
  { id: 'l4', kind: 'github', url: 'https://github.com/seojun-kim', title: 'seojun-kim', status: null, fitCount: 0, aiRead: true, createdAt: ago(9000) },
  { id: 'l5', kind: 'github', url: 'https://github.com/seojun-kim/settle-pipeline', title: 'settle-pipeline', status: null, fitCount: 0, aiRead: true, createdAt: ago(8000) },
  { id: 'l6', kind: 'portfolio', url: 'https://seojun.notion.site', title: '김서준 포트폴리오', status: null, fitCount: 0, aiRead: false, createdAt: ago(20000) },
  { id: 'l7', kind: 'blog', url: 'https://velog.io/@seojun/p95', title: '결제 승인 API p95 절반 아래로 줄이기', status: null, fitCount: 0, aiRead: false, createdAt: ago(30000) },
]

const deletedLinks = new Set<string>()
const linkNotFound = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'link' } } }

mock('GET', 'me/links', ({ query }) => {
  const kind = query.get('kind')
  const live = links.filter((l) => !deletedLinks.has(l.id)).slice(0, account.few ? 1 : undefined)
  return page(kind ? live.filter((l) => l.kind === kind) : live, query)
})
mock('POST', 'me/links', ({ body }) => {
  const b = body as { url: string; kind?: LinkKind; title?: string; aiRead?: boolean }
  if (!/^https?:\/\/[^\s@]+$/.test(b.url)) return { status: 422, body: { error: { code: 'VALIDATION', message: '링크 주소를 확인해 주세요' } } }
  const kind = b.kind ?? kindOf(b.url)
  const link: UserLink = {
    id: `l${Date.now()}`, kind, url: b.url, title: b.title ?? b.url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    status: kind === 'job' ? 'READING' : null, fitCount: 0, aiRead: !!b.aiRead, createdAt: new Date().toISOString(),
  }
  links.unshift(link)
  return { status: 201, body: { data: link } }
})
mock('DELETE', 'me/links/:id', ({ params }) => {
  if (!links.some((l) => l.id === params.id) || deletedLinks.has(params.id!)) return linkNotFound
  deletedLinks.add(params.id!)
})
mock('POST', 'me/links/:id/restore', ({ params }) => {
  const link = links.find((l) => l.id === params.id)
  if (!link) return linkNotFound
  deletedLinks.delete(link.id)
  return { data: link }
})

// ---------- 내 서류 · 계정 ----------

const docs: ChatDoc[] = [
  { id: 'd1', fileName: RESUME, size: 2_400_000, createdAt: '2026-10-12T09:00:00+09:00' },
  { id: 'd2', fileName: '경력기술서_모아페이.docx', size: 640_000, createdAt: '2026-09-28T09:00:00+09:00' },
  { id: 'd3', fileName: '포트폴리오_결제시스템.pdf', size: 8_100_000, createdAt: '2026-08-03T09:00:00+09:00' },
  { id: 'd4', fileName: '모아페이_맞춤_이력서_v2.pdf', size: 186_000, createdAt: ago(10), aiMade: true },
]
/** 내 서류 and 마이 › 서류 are one list; DELETE sources/:id (me.ts) calls this too. */
export const removeChatDoc = (id: string) => {
  const i = docs.findIndex((d) => d.id === id)
  if (i >= 0) docs.splice(i, 1)
}
mock('GET', 'chat/docs', () => ({ data: account.few ? docs.filter((d) => d.id === 'd2' || d.id === 'd4') : docs }))
mock('POST', 'chat/docs', ({ body }) => {
  const b = body as { fileName: string; size: number }
  const d: ChatDoc = { id: `d${Date.now()}`, fileName: b.fileName, size: b.size, createdAt: new Date().toISOString() }
  docs.unshift(d)
  return { status: 201, body: { data: d } }
})
// Tour switches (links.ts): `plan-ultra` is an ULTRA account (4x PRO's credits), `credits-out` has spent all of them (ChatNoCreditUltra).
// `few-materials` is the account ChatMention draws: two bookmarks, two documents, one link. `run` is the token the next messages play.
// `payments-closed` answers paymentsEnabled: false, so every buy button hides (PlanUpgradeClosed, PlanUltraClosed, ChatPh1FitClosed).
let account: { ultra: boolean; spent: boolean; few: boolean; closed: boolean; run?: string } = { ultra: false, spent: false, few: false, closed: false }
export const setAccount = (next: Partial<typeof account>) => {
  account = { ...account, ...next }
}
mock('GET', 'chat/account', () => {
  const total = account.ultra ? 20_000 : 5000
  const used = account.spent ? total : account.ultra ? 12_800 : 3200
  const now = new Date()
  return { data: { email: 'seojun.kim@gmail.com', plan: account.ultra ? 'ULTRA' : 'PRO', credits: { used, total }, ...(account.closed ? { paymentsEnabled: false } : {}), creditsRefillAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() } }
})

// ---------- quick-start ingredients ----------

const job = (id: string, over: string, title: string, sub: string, text: string, color: string, extra: Partial<QsData['items'][number]> = {}) => ({
  id, over, title, sub, logo: { text, color }, ...extra,
})
const JOBS = [
  job('p-moa', '모아페이', '백엔드 엔지니어 (Kotlin·Spring)', '서울 강남구 · 4–6년', '모', '#1F3A8A'),
  job('p-raon', '라온헬스', '안드로이드 개발자', '서울 강남구 · 1–3년', '라', '#364FC7'),
  job('p-star', '별빛게임즈', 'DevOps 엔지니어', '성남 판교 · 4–6년', '별', '#1864AB'),
]
const RECENT = [
  job('r-nuri', '누리클라우드', '프론트엔드 개발자', '서울 마포구 · 1–3년', '누', '#2B8A3E', { seg: 1 }),
  job('r-green', '그린티켓', '플랫폼 엔지니어', '서울 성동구 · 4–6년', '그', '#E67700', { seg: 1 }),
]
const person = (id: string, name: string, given: string, color: string, sub: string, extra: Partial<QsData['items'][number]> = {}) => ({
  id, title: name, sub, avatar: { text: given, color }, ...extra,
})

const quick: Record<string, QsData> = {
  link: { items: [], doc: RESUME },
  match: { items: [], chips: ['개발 · 백엔드', '경력 4–6년', '서울', 'Kotlin', 'Spring Boot'] },
  gap: { segments: ['북마크 4', '최근 본 공고'], items: [{ ...JOBS[0]!, selected: true }, ...JOBS.slice(1), ...RECENT], doc: RESUME },
  fit: { segments: ['북마크 4', '최근 본 공고'], items: [JOBS[0]!, { ...JOBS[1]!, selected: true }, JOBS[2]!, ...RECENT], doc: RESUME },
  boost: { items: [{ ...JOBS[0]!, selected: true }], doc: RESUME },
  deadline: {
    items: [
      job('d-pado', '파도AI', '데이터 분석가', '', '파', '#862E9C', { badge: { label: 'D-2', tone: 'red' }, note: { label: '서류 없음' } }),
      job('d-dotori', '도토리증권', '서버 개발자 (Go)', '', '도', '#343A40', { badge: { label: 'D-4', tone: 'grey' }, note: { label: '서류 준비됨', ac: true } }),
      job('d-green', '그린티켓', '그로스 마케터', '', '그', '#E67700', { badge: { label: 'D-6', tone: 'grey' }, note: { label: '서류 없음' } }),
      job('d-saebyuk', '새벽마켓', 'ML 엔지니어', '', '새', '#C2255C', { badge: { label: 'D-7', tone: 'grey' }, note: { label: '초안 있음' } }),
    ],
  },
  status: {
    segments: ['진행 중 4', '전체 6'],
    items: [
      job('s-moa', '모아페이', '결제 플랫폼 시니어 엔지니어', '', '모', '#1F3A8A', { badge: { label: '면접', tone: 'orange' }, selected: true }),
      job('s-dotori', '도토리증권', '서버 개발자 (Go)', '', '도', '#343A40', { badge: { label: '서류', tone: 'ac' }, selected: true }),
      job('s-star', '별빛게임즈', 'DevOps 엔지니어', '', '별', '#1864AB', { badge: { label: '지원함', tone: 'grey' }, selected: true }),
      job('s-raon', '라온헬스', '백엔드 개발자 (Java)', '', '라', '#364FC7', { badge: { label: '합격', tone: 'green' } }),
      // Same ids as the 진행 중 rows, as the real list has (one application listed under both tabs is one pick).
      ...[
        job('s-moa', '모아페이', '결제 플랫폼 시니어 엔지니어', '', '모', '#1F3A8A', { badge: { label: '면접', tone: 'orange' }, seg: 1, selected: true }),
        job('s-dotori', '도토리증권', '서버 개발자 (Go)', '', '도', '#343A40', { badge: { label: '서류', tone: 'ac' }, seg: 1, selected: true }),
        job('s-star', '별빛게임즈', 'DevOps 엔지니어', '', '별', '#1864AB', { badge: { label: '지원함', tone: 'grey' }, seg: 1, selected: true }),
        job('s-raon', '라온헬스', '백엔드 개발자 (Java)', '', '라', '#364FC7', { badge: { label: '합격', tone: 'green' }, seg: 1 }),
        job('a-nuri', '누리클라우드', '백엔드 개발자', '', '누', '#2B8A3E', { badge: { label: '불합격', tone: 'grey' }, seg: 1 }),
        job('a-pado', '파도AI', '데이터 엔지니어', '', '파', '#862E9C', { badge: { label: '지원 취소', tone: 'grey' }, seg: 1 }),
      ],
    ],
  },
  calendar: {
    calendar: { connected: true },
    items: [
      { id: 'e1', title: '파도AI · 데이터 분석가', sub: '23:59 마감', date: { dow: '목', day: '22', color: 'red' }, badge: { label: '마감', tone: 'red' } },
      { id: 'e2', title: '모아페이 · 1차 면접', sub: '오후 2:00 · 화상', date: { dow: '금', day: '23', color: 'orange' }, badge: { label: '면접', tone: 'orange' } },
      { id: 'e3', title: '이하은 님과 커피챗', sub: '오전 11:00 · 강남역', date: { dow: '일', day: '25', color: 'green' }, badge: { label: '커피챗', tone: 'green' } },
    ],
  },
  hub: {
    doc: RESUME,
    items: [
      { id: 'headline', title: '헤드라인', sub: '한 줄 소개', selected: true },
      { id: 'intro', title: '소개', sub: '3~4문장', selected: true },
      { id: 'careers', title: '경력', sub: '2건' },
      { id: 'skills', title: '기술 스택', sub: '6개' },
    ],
  },
  exp: {
    items: [
      { id: 'kafka', title: 'Kafka 운영 경험', sub: '컨슈머 지연·재처리를 다뤄 본 근거', meta: '모아페이 백엔드 · 우대 사항', selected: true },
      { id: 'load', title: '대용량 부하 테스트', sub: '초당 1만 건 이상 처리한 기록', meta: '도토리증권 서버 · 자격 요건' },
    ],
  },
  reply: {
    items: [
      person('o1', '오지현', '지현', '#E8590C', '모아페이 · 결제 플랫폼팀 채용 담당', { badge: { label: '새 제안', tone: 'ac' }, meta: '2시간 전', body: '결제 플랫폼팀 시니어 포지션으로 커피챗 어떠세요?' }),
      person('o2', '박도윤', '도윤', '#0C8599', '하루랩스 · iOS 개발자', { badge: { label: '새 제안', tone: 'ac' }, meta: '어제', body: '주말 사이드 프로젝트를 같이 하실 백엔드 개발자를…' }),
      person('o3', '최지우', '지우', '#5F3DC4', '파도AI · 데이터 엔지니어', { meta: '10월 14일', body: '정산 데이터 파이프라인 경험을 듣고 싶어요.' }),
    ],
  },
  coffee: {
    segments: ['팔로잉 18', '허브 추천'],
    items: [
      person('f1', '이하은', '하은', '#0C8599', 'React로 사용자 경험을 다듬어요', { selected: true }),
      person('f2', '김태윤', '태윤', '#3B5BDB', '결제 시스템을 만드는 백엔드 개발자'),
      person('f3', '최지우', '지우', '#5F3DC4', '데이터 파이프라인 · Spark · Airflow'),
      person('h1', '정민서', '민서', '#2F9E44', '정산 시스템을 운영하는 백엔드 리드', { seg: 1 }),
      person('h2', '한유진', '유진', '#E8590C', 'Kafka와 이벤트 설계를 좋아해요', { seg: 1 }),
    ],
  },
  post: {
    items: [
      { id: 'p1', title: '결제 승인 API p95를 절반 아래로 줄인 이야기', sub: '개발 · 이력서 경력에서', selected: true },
      { id: 'p2', title: '4년차 백엔드 이직 준비 후기', sub: '커리어 · 지원 현황에서' },
      { id: 'p3', title: 'Kafka 정산 파이프라인 만들어 본 후기', sub: '개발 · 역량 보완 프로젝트에서' },
    ],
  },
}
mock('GET', 'chat/quick-starts/:key', ({ params }) => ({ data: quick[params.key!] ?? { items: [] } }))

