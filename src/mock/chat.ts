// Mock routes for the chat area. Owned by that area's screens.
// Sample data follows the AI 채팅 artboards (김서준, 모아페이 …).
import type { ConversationTurn, LinkKind, Message, UserLink } from '@push/api-client'
import type { Approval, ChatDoc, ChatEvent, ChatItem, Choice, ConversationRow, QsData, RunInput, Step } from '@/features/chat'
import { DEFAULT_ERROR_TEXT, ERROR_TEXT, MULTI_PICK_FOOT, MULTI_PICK_SUBMIT, PICK_HINT } from '../features/chat/constants'
import { kindOf } from '../features/chat/utils/links'
import { mock, page } from './server'

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
  conv('c-moa', '모아페이 백엔드 이력서', 10, '이 변경을 이력서에 반영할까요?', 'NEEDS_APPROVAL'),
  conv('c-dotori', '도토리증권 공고 갭 분석', 60, '경력 섹션 고치는 중', 'RUNNING'),
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
const byRecent = (rows: ConversationRow[]) => rows.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
const live = () => byRecent(conversations.filter((c) => !archived.has(c.id)))
const find = (id: string) => conversations.find((c) => c.id === id)

mock('GET', 'conversations', ({ query }) =>
  page(query.get('archived') === 'true' ? byRecent(conversations.filter((c) => archived.has(c.id))) : live(), query),
)
mock('POST', 'conversations', ({ body }) => {
  if (!referenceData) return { status: 403, body: { error: { code: 'CONSENT_REQUIRED', message: 'consent' } } }
  const b = body as { title: string }
  const c = conv(`c-${Date.now()}`, b.title.slice(0, 300), 0, '')
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
mock('GET', 'me/consents', () => ({ data: { referenceData, updatedAt: null } }))
mock('PUT', 'me/consents', ({ body }) => {
  referenceData = (body as { referenceData?: boolean }).referenceData === true
  return { data: { referenceData, updatedAt: new Date().toISOString() } }
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

const s = (wait: number, event: ChatEvent): Step => ({ wait, event })
const status = (...verbs: string[]): ChatEvent => ({ type: 'status', verbs })
const agent = (id: string, text: string, bullets?: string[]): ChatItem => ({ type: 'agentText', id, text, bullets })
const tool = (id: string, action: string, target: string | undefined, state: 'run' | 'ok' | 'err' | 'wait', result?: string, extra?: string[]): ChatItem => ({
  type: 'tool', id, action, target, state, result, extra,
})
const todo = (id: string, labels: string[], done: number, added = -1, title?: string): ChatItem => ({
  type: 'todo',
  id,
  title,
  items: labels.map((label, i) => ({ label, state: i < done ? 'done' : i === done || i === added ? 'now' : 'todo', added: i === added })),
})
const ask = (approval: Approval) => s(500, { type: 'approval', approval })
const numbered = (id: string, question: string, items: (string | Choice)[], foot = PICK_HINT, selected = [0]): Approval => ({
  id,
  question,
  sections: [{ kind: 'choices', items: items.map((x) => (typeof x === 'string' ? { label: x } : x)), selected }],
  foot,
})
const done = s(200, { type: 'done', at: 0 })
const awaitingDone = s(200, { type: 'done', at: 0, awaiting: 'approval' })

const RESUME = '김서준_백엔드_이력서_2026.pdf'
const MOA = '모아페이 · 백엔드 엔지니어'
const PROFILE_TODO = ['프로필 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', '프로필에 저장']
const TODO = ['이력서 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', 'PDF로 만들기']
const FILE_TODO = TODO
const PROFILE_TASK = '프로필 수정 · Push 프로필 · 경력'
const FILE_PAGE = 'A4 1쪽 · 186KB'
const FILE_SAVED = '내 서류에 자동 저장됨'
const TODO_PLUS = ['이력서 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', '자기소개서 초안 쓰기', 'PDF로 만들기']
const BULLETS = ['승인 API 성과를 숫자로 보여 줬어요', 'Kafka를 기술 스택 맨 앞으로 옮겼어요', '동아리 활동은 한 줄로 줄였어요']
// Hold a running line this long so a screenshot can catch it.
const DWELL = 8000
const JD_LINES = ['필수 · Kotlin 또는 Java 4년 이상', '필수 · Spring Boot 운영', '필수 · RDBMS 설계와 튜닝', '필수 · 대용량 트래픽 처리', '필수 · 결제·정산 도메인 이해', '우대 · Kafka · 장애 대응 · MSA']

const tailorRead: Step[] = [
  s(200, status('훑어보는 중…', '읽어 보는 중…')),
  s(700, agent('hi', '좋아요. 공고와 이력서를 비교해서 맞춤 초안을 만들어 볼게요.')),
  s(400, todo('todo', TODO, 0)),
  s(300, tool('resume', '이력서 읽기', RESUME, 'run', '쪽마다 읽는 중')),
  s(1400, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  s(200, todo('todo', TODO, 1)),
  s(200, tool('jd', '공고 읽기', MOA, 'run', '필수·우대 요건을 뽑는 중')),
  s(1500, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개', JD_LINES)),
]

const tailorFit = (labels: string[], added = -1): Step[] => [
  s(200, todo('todo', labels, 2, added)),
  s(100, status(added < 0 ? '맞춰보는 중…' : '다시 맞춰보는 중…', '견주어 보는 중…', '따져 보는 중…')),
  s(200, tool('fit', '적합도 계산', added < 0 ? '5개 항목' : '이어서', 'run', added < 0 ? '기술 스택을 비교하는 중' : '경력 수준을 비교하는 중')),
  s(DWELL, tool('fit', '적합도 계산', '5개 항목', 'run', '경험 연관성을 비교하는 중')),
  s(1300, tool('fit', '적합도 계산', '5개 항목', 'ok', '6.9점 · 키워드와 도메인이 약해요')),
  s(300, {
    type: 'fit', id: 'fitcard', score: 8.1, from: 6.9, delta: '+1.2 예상',
    rows: [{ label: '기술 스택', score: 7.5 }, { label: '경험 연관성', score: 8.2 }, { label: '키워드', score: 4.5 }],
  }),
  s(400, todo('todo', labels, 3, added)),
  s(500, agent('plan', '경력 섹션부터 공고에 맞게 고쳐 볼게요.')),
  s(300, status('끄적이는 중…', '고쳐 쓰는 중…')),
  s(1200, tool('edit', '이력서 수정', '경력 · 모아페이', 'wait', '2줄 추가, 1줄 삭제')),
  s(200, {
    type: 'diff', id: 'diff',
    lines: [
      { n: 12, sign: '', text: '모아페이 · 백엔드 엔지니어 · 2022.03–현재' },
      { n: 13, sign: '-', text: '결제 API 개발 및 운영' },
      { n: 13, sign: '+', text: '결제 승인 API를 Kotlin·Spring으로 재설계, p95 응답 320ms → 140ms' },
      { n: 14, sign: '+', text: 'Kafka 이벤트 파이프라인으로 정산 지연을 하루에서 10분으로 단축' },
      { n: 15, sign: '', text: '결제 장애 대응 매뉴얼 작성' },
    ],
  }),
  ask({ id: 'tailor-apply', question: '이 수정을 적용할까요?', sections: [], submit: '적용', secondary: '그대로 두기', foot: PICK_HINT }),
]

// What the mapper makes of the server's result frame: the task line, the summary, then the card.
const finish = (score: string, josa = '로'): Step[] => [
  s(400, todo('todo', PROFILE_TODO, PROFILE_TODO.length)),
  s(200, tool('task', '프로필 수정', 'Push 프로필 · 경력', 'ok')),
  s(200, agent('done', `다 됐어요! 적합도를 **${score}**${josa} 올렸어요.`, BULLETS)),
  s(200, {
    type: 'result',
    id: 'result',
    source: 'profile',
    checklist: PROFILE_TODO,
    name: '김서준',
    headline: '백엔드 엔지니어',
    title: '김서준 · 백엔드 엔지니어',
    subtitle: 'Push 프로필 · 방금 수정',
    documentId: 'd1',
    company: '모아페이',
    actions: [
      { id: 'apply', label: '모아페이에 바로 지원하기' },
      { id: 'view', label: '프로필 보기' },
    ],
  }),
  ask({ ...numbered('present', 'Push 프로필에 저장했어요. 결과를 확인할까요?', ['확인했어요', '그만하기']), pendingNote: 'PDF는 Push 프로필에서 내보낼 수 있어요.' }),
  awaitingDone,
]

// Upload scenarios (ChatDone, ChatDoneNoJob, ChatDoneSaveFail, ChatPh6ResultFile, ChatPh6ResultFail).
const EXT_FILE = '김서준_모아페이_백엔드.pdf'
const ext = (o: { todo?: string[]; text?: string; fileName?: string; saved?: boolean; job?: boolean; gate?: string; josa?: string }): Step[] => {
  const labels = o.todo ?? FILE_TODO
  const job = o.job ?? true
  const saved = o.saved ?? true
  return [
    s(200, todo('todo', labels, labels.length)),
    s(200, tool('task', '이력서 수정', '올린 파일 · 경력', 'ok')),
    s(300, agent('done', o.text ?? `다 됐어요! 적합도를 **6.9 → 8.1**${o.josa ?? '로'} 올렸어요.`, BULLETS)),
    s(200, {
      type: 'result',
      id: 'result',
      source: 'external',
      checklist: labels,
      fileName: o.fileName ?? EXT_FILE,
      pageLine: FILE_PAGE,
      ...(saved ? { savedLine: FILE_SAVED } : {}),
      cardMeta: saved ? `${FILE_PAGE} · ${FILE_SAVED}` : FILE_PAGE,
      documentId: 'src-upload',
      ...(job ? { company: '모아페이' } : {}),
      actions: o.gate
        ? []
        : [
            ...(job ? [{ id: 'apply', label: '모아페이에 바로 지원하기' }] : []),
            ...(saved ? [{ id: 'convert', label: '프로필로 전환', method: 'POST', path: '/api/v1/documents/src-upload/profile' }] : []),
          ],
    }),
    ...(o.gate ? [ask(numbered('ext-gate', o.gate, ['확인했어요', '그만하기'])), awaitingDone] : [done]),
  ]
}
const fileRun = (): Step[] => ext({})

const tailorDone = (labels: string[]): Step[] => [
  s(300, todo('todo', labels, labels.length - 1)),
  s(200, status('Push 프로필에 저장하는 중…')),
  s(200, todo('todo', labels, labels.length)),
  ...finish('6.9 → 8.1'),
]

const tailorResume: Step[] = [
  s(200, { type: 'think', id: 'think', seconds: 6 }),
  s(600, agent('resume-msg', '알겠어요. 할 일에 자기소개서를 넣고, 멈춘 곳부터 이어서 할게요.')),
  s(300, status('다시 맞춰보는 중…')),
  ...tailorFit(TODO_PLUS, 4),
]

const failRun: Step[] = [
  s(200, status('훑어보는 중…')),
  s(300, tool('resume', '이력서 읽기', RESUME, 'run', '쪽마다 읽는 중')),
  s(1200, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건')),
  s(200, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'run', '저장소를 훑는 중')),
  s(2000, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'wait', '시간이 오래 걸려서 한 번 더 시도했어요 · 저장소 3개만 읽었어요')),
  s(200, tool('jd', '공고 읽기', '회사 채용 페이지', 'run', '본문을 읽는 중')),
  s(1500, { type: 'tool', id: 'jd', action: '공고 읽기', target: '회사 채용 페이지', state: 'err', error: '“자격 요건”을 읽지 못했어요 · 로그인이 필요한 영역이에요' }),
  s(400, agent('warn', '나머지 내용으로 진행할 수 있지만, 자격 요건이 빠지면 적합도가 정확하지 않을 수 있어요.')),
  ask(numbered('fail-choice', '어떻게 할까요?', ['공고 내용을 붙여넣을게요', '이대로 진행해 주세요', 'Push 공고에서 고를게요'])),
]

const say = (id: string, text: string): Step[] => [s(600, agent(id, text)), done]

// Phase boards ChatPh0 … ChatPh6Apply as one guided flow.
const ph0: Step[] = [
  s(300, status('생각하는 중…')),
  s(600, agent('ph0', '좋아요! 시작하기 전에 하나만 여쭤볼게요.')),
  ask(numbered('ph0', '어떤 방식으로 진행할까요?', ['이력서부터 쓸게요', '경험부터 정리할게요', '그만하기'])),
]
const ph0Input: Step[] = [
  s(500, agent('ph0i', 'Push에 있는 자료부터 찾아볼게요.')),
  s(300, tool('find', '자료 찾기', '마이 › 서류 · 북마크 공고', 'run', '서류와 북마크를 훑는 중')),
  s(1200, tool('find', '자료 찾기', '마이 › 서류 · 북마크 공고', 'ok', '이력서 3개 · 북마크 공고 2개 · GitHub 링크 1개')),
  ask({
    id: 'ph0-input',
    question: '어떤 산출물을 만들까요?',
    sections: [
      { kind: 'chips', multi: true, options: ['이력서', '포트폴리오', '자기소개서'], selected: [0] },
      {
        kind: 'rows',
        title: '가져올 자료',
        items: [
          { tag: 'PDF', title: RESUME, sub: '마이 › 서류', ac: true, action: 'change' },
          { tag: '모', title: '백엔드 엔지니어 (Kotlin·Spring)', sub: '홈 › 북마크 공고', ac: true, action: 'change' },
          { tag: 'link', title: 'github.com/seojun-kim', sub: '이력서에서 찾았어요', action: 'change' },
        ],
      },
      { kind: 'chips', title: '어떤 말투로 쓸까요?', options: ['전문적으로', '자신 있게', '짧게', '기술 중심으로', '협업 중심으로', '원래 말투로'], selected: [5] },
    ],
    secondary: '그만하기',
    submit: '이대로 진행',
    answer: '1번, 지금 이력서로 할게요',
  }),
]
const ph0Start: Step[] = [
  s(400, tool('input', '입력 정리', undefined, 'ok', `이력서 **${RESUME}**\n공고 **${MOA}**\nGitHub **github.com/seojun-kim** · 말투 **그대로**`)),
  ask(numbered('ph0-start', '이대로 분석을 시작할까요?', ['네, 시작해 주세요', '자료를 바꿀래요', '그만할게요'])),
]
// The analysis card by plan: FREE locks the part rows, PRO teases ULTRA, ULTRA unfolds the projection.
const ph1Fit = (plan: 'FREE' | 'PRO' | 'ULTRA', gateWait = 500): Step[] => [
  s(300, {
    type: 'fit', id: 'fit1', score: 6.9, caption: '보통 · 개선 여지 있어요', plan, summary: '기술 스택은 잘 맞아요. 키워드와 정산 도메인이 약해요.',
    rows: [
      { label: '기술 스택', score: 7.5 }, { label: '경험 연관성', score: 7.0 }, { label: '경력 수준', score: 8.0 },
      { label: '키워드', score: 4.5 }, { label: '도메인', score: 5.0 },
    ],
    keywords: [
      { label: 'Kotlin', ok: true }, { label: 'Spring Boot', ok: true }, { label: 'JPA', ok: true },
      { label: 'Kafka', ok: false }, { label: '정산 도메인', ok: false },
    ],
    ...(plan === 'ULTRA' ? { projected: { label: '8점대', bullets: ['승인 API 성과를 숫자로 보여 주기', 'Kafka를 기술 스택 맨 앞으로 옮기기', '정산 도메인 경험을 한 줄 추가하기'] } } : {}),
  }),
  { ...ask(numbered('ph1-fit', '이 공고에 맞춰 이력서를 고칠까요?', ['네, 맞춰서 고쳐 주세요', '피드백만 받을게요', '점수만 보고 끝낼게요'])), wait: gateWait },
]
const ph1Plan = (plan: 'FREE' | 'ULTRA', gateWait?: number): Step[] => [
  s(200, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'ok', '6.9점')),
  ...ph1Fit(plan, gateWait),
]
const PH1 = ['이력서 읽기', 'GitHub 살펴보기', '공고 분석', '적합도 계산']
const ph1: Step[] = [
  s(200, status('훑어보는 중…', '읽어 보는 중…')),
  s(300, todo('todo1', PH1, 0)),
  s(200, tool('resume', '이력서 읽기', RESUME, 'run', '쪽마다 읽는 중')),
  s(1300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  s(200, todo('todo1', PH1, 1)),
  s(200, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'run', '저장소를 훑는 중')),
  s(1500, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'ok', '저장소 12개 중 공고 관련 3개', ['payment-retry-lab', 'settle-pipeline', 'kotlin-ledger'])),
  s(300, agent('repo', '이력서에 없는 저장소 **payment-retry-lab**을 찾았어요. 경험으로 넣을지 분석이 끝나면 여쭤볼게요.')),
  s(200, todo('todo1', PH1, 2)),
  s(200, tool('jd', '공고 읽기', MOA, 'run', '필수·우대 스택을 뽑는 중')),
  s(DWELL, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개', JD_LINES)),
  s(200, todo('todo1', PH1, 3)),
  s(200, status('맞춰보는 중…')),
  s(200, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'run', '항목별 점수를 내는 중')),
  s(1500, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'ok', '6.9점')),
  s(200, todo('todo1', PH1, 4)),
  ...ph1Fit('PRO'),
]
const feedbackOnly: Step[] = [
  s(300, tool('fbt', '피드백 정리', '공고 요건 ↔ 내 이력서', 'ok', '고칠 점 3개')),
  s(400, agent('fb', '이 공고 기준으로 고칠 점이에요.')),
  s(300, {
    type: 'plan', id: 'fbplan', title: '', meta: '',
    rows: [
      { tag: '키워드', tone: 'orange', label: 'Kafka, 정산 배치가 없어요', note: '경험 문장에 직접 넣어 주세요' },
      { tag: '도메인', tone: 'orange', label: '정산 경험이 약해 보여요', note: 'payment-retry-lab을 정산 맥락으로 써 주세요' },
      { tag: '성과', tone: 'grey', label: '숫자가 부족해요', note: '승인 API 개선 결과를 수치로 보여 주세요' },
    ],
    keywords: [],
  }),
  ask(numbered('feedback', '피드백을 반영해서 수정할까요?', ['반영해서 수정할게요', '그만하기'])),
]
const startDocument: Step[] = [
  s(400, agent('resume-note', '작성 중인 이력서 초안(v1)이 있어요.')),
  ask(numbered('start-document', '이어서 작성할까요?', ['이어서 작성하기', '그만하기'])),
]
const ph2: Step[] = [
  s(200, status('궁리하는 중…')),
  s(200, tool('strategy', '전략 세우기', '공고 요건 ↔ 내 경력', 'run', '섹션마다 할 일을 정하는 중')),
  s(1500, tool('strategy', '전략 세우기', '공고 요건 ↔ 내 경력', 'ok', '섹션 5개 · 추가할 키워드 4개')),
  s(300, {
    type: 'plan', id: 'plan', title: '수정 전략', meta: '섹션 5개',
    rows: [
      { tag: '강화', tone: 'ac', label: '경력 · 모아페이', note: '대용량 결제 요구 → 승인 API 성과를 숫자로' },
      { tag: '수정', tone: 'grey', label: '기술 스택', note: 'Kafka 경험을 맨 앞으로' },
      { tag: '추가', tone: 'green', label: '프로젝트 · payment-retry-lab', note: '우대 사항 “장애 대응” 근거' },
      { tag: '축소', tone: 'orange', label: '사내 동아리 활동', note: '공고와 연관이 낮아요' },
    ],
    keywords: ['결제 승인', '정산 배치', 'Kafka', '장애 대응'],
  }),
  ask(numbered('ph2', '이 전략대로 초안을 쓸까요?', ['초안 쓸게요', '피드백만 볼게요', '그만하기'])),
]
const PH3 = ['요약', '경력', '프로젝트', '기술 스택', '학력']
const ph3: Step[] = [
  s(200, status('끄적이는 중…', '고쳐 쓰는 중…')),
  s(200, todo('todo3', PH3, 1)),
  s(200, tool('draft', '초안 쓰기', '이력서 v1 · 경력', 'run', '경력 섹션을 쓰는 중')),
  s(300, {
    type: 'paper', id: 'paper', label: '이력서 초안 v1', heading: '김서준 · 백엔드 개발자',
    lines: ['모아페이 · 백엔드 엔지니어 · 2022.03–현재', '• 결제 승인 API를 Kotlin·Spring으로 재설계, p95 응답 320ms → 140ms', '• Kafka 기반 결제 이벤트 파이프라인을 구축해 정산 지연을'],
  }),
  s(DWELL, todo('todo3', PH3, 3)),
  s(1200, todo('todo3', PH3, 5)),
  s(300, tool('draft', '초안 쓰기', '이력서 v1', 'ok', '1쪽 · 섹션 5개 · 말투 그대로')),
  s(200, { type: 'file', id: 'v1', name: '이력서 초안 v1', meta: '1쪽 · 방금', preview: true }),
  s(200, {
    type: 'diff', id: 'diff3',
    lines: [
      { sign: '+', text: '승인 API 성과를 숫자로 강조' },
      { sign: '+', text: '프로젝트 payment-retry-lab 추가' },
      { sign: '~', text: 'Kafka를 기술 스택 맨 앞으로' },
      { sign: '-', text: '사내 동아리 활동 세부 내용' },
    ],
  }),
  ask(numbered('ph3-review', '첫 번째 초안(v1)이에요. 이대로 검토할까요?', ['검토할게요', '그만하기'])),
]
const ph3Boost: Step[] = [
  s(200, status('점수 올리는 중…')),
  s(200, tool('boost1', '점수 올리기 1회', '키워드 밀도', 'run', '키워드를 넣는 중')),
  s(1300, tool('boost1', '점수 올리기 1회', '키워드 밀도', 'ok', '6.9 → 7.8 · 결제 승인, 정산 배치 키워드를 넣었어요')),
  s(200, tool('boost2', '점수 올리기 2회', '도메인 경험', 'run', '도메인 맥락을 다시 쓰는 중')),
  s(1300, tool('boost2', '점수 올리기 2회', '도메인 경험', 'ok', '7.8 → 8.3 · payment-retry-lab을 정산 맥락으로 다시 썼어요')),
  s(300, { type: 'fit', id: 'boost', score: 8.3, from: 6.9, delta: '+1.4', note: '적합도 6.9 → 8.3 (+1.4)' }),
  ask(numbered('ph3-boost', '점수를 한 번 더 올릴까요?', ['한 번 더 올리기', '여기서 멈추기', '그만하기'])),
]
const ph4Quality: Step[] = [
  s(200, status('검사하는 중…')),
  s(300, tool('qa', '품질 검사', '오타 · 문법 · 말투 · ATS', 'run', '문장을 하나씩 보는 중')),
  s(1200, tool('qa', '품질 검사', '오타 · 문법 · 말투 · ATS', 'ok', '바로 고친 것 2개 · 추천 3개')),
  s(200, {
    type: 'diff', id: 'qdiff',
    lines: [
      { n: 8, sign: '-', text: '결제 트랜젝션 처리 성능 개선' },
      { n: 8, sign: '+', text: '결제 트랜잭션 처리 성능 개선' },
      { n: 12, sign: '-', text: '모아페이 · 2022.04–현재' },
      { n: 12, sign: '+', text: '모아페이 · 2022.03–현재' },
    ],
  }),
  ask({
    id: 'ph4-quality',
    question: '추천 수정도 반영할까요?',
    sections: [
      {
        kind: 'toggle',
        items: [{ label: '가운데점(·) 나열을 쉼표로' }, { label: '경력 본문의 현재형 문장 2곳' }, { label: '말투 통일하기', desc: '“~했음”과 “~했습니다”가 섞였어요' }],
        selected: [0, 1],
        ids: ['dots', 'tense', 'tone'],
      },
    ],
    submit: '{n}개 반영하고 디자인으로',
    zeroSubmit: '그대로 디자인으로',
  }),
]
const TEMPLATES = ['클래식', '모던', '컴팩트', 'ATS']
const ph4Design: Step[] = [
  s(300, tool('applied', '추천 수정 반영', '2개', 'ok', '쉼표 정리 · 현재형 문장 고침')),
  s(400, agent('tpl', '템플릿을 골라 주세요. 처음이라면 클래식을 추천해요.')),
  ask({
    id: 'ph4-design',
    question: '검증을 마쳤어요. 어떤 디자인을 적용할까요?',
    sections: [
      { kind: 'templates', items: TEMPLATES.map((label, i) => ({ id: `t${i}`, label, ...(i === 0 ? { recommended: true } : {}) })), selected: [0] },
      { kind: 'toggle', items: [{ label: '프로필 사진 넣기', desc: '마이 › 프로필 사진을 써요 · 모든 템플릿' }], selected: [], ids: ['photo'] },
    ],
    submit: '클래식으로 만들기',
    submitLabels: { t0: '클래식으로 만들기', t1: '모던으로 만들기', t2: '컴팩트로 만들기', t3: 'ATS로 만들기' },
    secondary: '그만하기',
  }),
]
const ph5: Step[] = [
  s(200, status('정리하는 중…')),
  s(300, tool('design', '디자인 적용', '모던', 'ok', 'A4 1쪽 · 여백과 줄 간격 맞춤')),
  s(300, tool('photo', '프로필 사진', '마이 › 프로필', 'ok', '헤더 왼쪽 원형 80px')),
  s(300, tool('save', 'Push 프로필', '마이 › 프로필', 'run', 'Push 프로필에 저장하는 중…')),
  s(DWELL, tool('save', 'Push 프로필', '마이 › 프로필', 'ok', '저장했어요')),
]
const ph2xApproach: Step[] = [
  s(200, status('공고 뜯어보는 중…')),
  s(300, tool('jd', '공고 분석', MOA, 'run', '필수 스택을 뽑는 중')),
  s(1300, tool('jd', '공고 분석', MOA, 'ok', '필수 스택 5개 · 서비스 도메인: 결제·정산')),
  s(400, agent('x', '공고에 필요한 경험을 만들 방향을 골라 주세요.')),
  ask(numbered('ph2x-approach', '어떤 접근 방식으로 진행할까요?', ['병목을 만들게요', '문제를 예방할게요', '그만하기'])),
]
const ph2xLevel: Step[] = [
  ask(numbered('ph2x-level', '병목 강도를 어느 정도로 할까요?', ['가벼운 제약으로', '중간 제약으로', '강한 제약으로', '그만하기'], PICK_HINT, [1])),
]
const PREVENT = ['성능', '보안', '확장성', '안정성', '유지보수', '데이터 무결성', '그만하기']
const ph2xPrevent: Step[] = [
  ask({
    ...numbered('ph2x-prevent', '어떤 문제를 예방할까요?', PREVENT, MULTI_PICK_FOOT),
    submit: MULTI_PICK_SUBMIT,
    sections: [{ kind: 'choices', multi: true, selected: [], items: PREVENT.map((label) => ({ label })) }],
  }),
]
const ph2xBlueprints: Step[] = [
  s(200, status('기획하는 중…')),
  s(300, tool('check', '방향 검증', '5개 기준', 'run', '공고 연관성을 보는 중')),
  s(1200, tool('check', '방향 검증', '5개 기준', 'ok', '공고 연관성·임팩트·실현 가능성 모두 통과')),
  s(300, {
    type: 'plan', id: 'bplan', title: '프로젝트 기획서', meta: '4개',
    rows: [
      { tag: '통과', tone: 'green', label: '결제 승인 재시도 큐', note: '안정성 · Kotlin, Kafka' },
      { tag: '통과', tone: 'green', label: '정산 배치 병렬화', note: '데이터 무결성 · Spring Batch' },
      { tag: '조건부', tone: 'orange', label: '결제 이벤트 아웃박스', note: '무결성 · Kafka, JPA' },
      { tag: '통과', tone: 'green', label: '가맹점 API 레이트 리미터', note: '안정성 · Redis' },
    ],
    keywords: [],
  }),
  ask(numbered('ph2x-bp', '어떤 프로젝트를 구현할까요?', ['기획만 볼게요', '그만하기'])),
]

const applyRun: Step[] = [
  s(200, status('지원 준비하는 중…')),
  s(300, tool('save', '내 서류에 저장', undefined, 'run', '저장하는 중')),
  s(900, tool('save', '내 서류에 저장', undefined, 'ok', '저장했어요 · Push 프로필')),
  s(300, tool('apply', '지원하기', MOA, 'wait', '확인을 기다리는 중')),
  ask({ ...numbered('apply', '이 공고에 지원해요', ['실행', '취소']), foot: undefined, warning: '지원하면 취소할 수 없어요' }),
]

const generic = (text: string): Step[] => [
  s(200, status('정리하는 중…', '살펴보는 중…', '궁리하는 중…')),
  s(700, agent('ack', '알겠어요. 필요한 자료부터 살펴볼게요.')),
  s(300, tool('req', '요청 정리', text.length > 24 ? `${text.slice(0, 24)}…` : text, 'run', '할 일을 나누는 중')),
  s(1500, tool('req', '요청 정리', text.length > 24 ? `${text.slice(0, 24)}…` : text, 'ok', '할 일 3개로 나눴어요')),
  ...say('answer', '정리했어요. 더 필요한 게 있으면 말해 주세요.'),
]

/** Approval id → choice → next steps. */
const next: Record<string, (choice: number, labels: string[]) => Step[]> = {
  'tailor-apply': (c, l) => (c === 0 ? tailorDone(l) : [s(200, tool('edit', '이력서 수정', '경력 · 모아페이', 'ok', '그대로 뒀어요')), ...say('leave', '이 수정은 적용하지 않았어요.')]),
  'fail-choice': (c) =>
    c === 0 ? say('paste', '공고 본문을 붙여넣어 주세요. 받는 대로 이어서 할게요.')
      : c === 1 ? tailorFit(TODO)
        : say('pick', '북마크한 공고 중에서 골라 주세요. @언급으로 불러올 수 있어요.'),
  present: (c) => (c === 0 ? [done] : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  ph0: (c) => (c === 0 ? ph0Input : c === 1 ? ph2xApproach : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph0-input': () => ph0Start,
  'ph0-start': (c) => (c === 0 ? ph1 : c === 1 ? ph0Input : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph1-fit': (c) => (c === 0 ? ph2 : c === 1 ? feedbackOnly : say('score', '적합도는 6.9점이에요. 필요하면 언제든 고쳐 드릴게요.')),
  feedback: (c) => (c === 0 ? ph2 : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'start-document': (c) => (c === 0 ? say('cont', '멈춘 곳부터 이어서 할게요.') : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  ph2: (c) => (c === 0 ? ph3 : c === 1 ? say('fb-only', '피드백만 정리해 드릴게요. 초안은 쓰지 않았어요.') : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph3-review': (c) => (c === 0 ? ph3Boost : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph3-boost': (c) =>
    c === 0
      ? [s(400, agent('stall', '최대 5번까지 올렸어요.')), ...ph4Quality]
      : c === 1
        ? ph4Quality
        : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.'),
  'ph4-quality': () => ph4Design,
  'ph4-design': (c) => (c === -1 ? say('bye', '알겠어요. 필요할 때 다시 불러 주세요.') : [...ph5, ...finish('6.9 → 8.1', '으로')]),
  'ph2x-verify': (c) => (c === 0 ? ph2xLevel : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'ext-gate': (c) => (c === 0 ? [done] : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph2x-approach': (c) => (c === 0 ? ph2xLevel : c === 1 ? ph2xPrevent : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph2x-level': (c) => (c === 3 ? say('bye', '알겠어요. 필요할 때 다시 불러 주세요.') : ph2xBlueprints),
  'ph2x-prevent': (c) => (c === 6 ? say('bye', '알겠어요. 필요할 때 다시 불러 주세요.') : ph2xBlueprints),
  'ph2x-bp': (c) => (c === 0 ? say('bp-done', '기획서 4개를 내 서류에 저장했어요.') : say('bye', '알겠어요. 필요할 때 다시 불러 주세요.')),
  apply: (c) =>
    c === 0
      ? [s(300, tool('apply', '지원하기', MOA, 'ok', '지원했어요 · 마이 › 내 활동에 기록했어요')), ...say('applied', '지원했어요. 내 활동에서 진행 상황을 볼 수 있어요.')]
      : [s(300, tool('apply', '지원하기', MOA, 'ok', '지원하지 않았어요')), ...say('later', '천천히 보고 말해 주세요.')],
}

// Per conversation: id prefix for the current scenario (so continuations update the same lines) and its to-do labels.
const scenario = new Map<string, { prefix: string; labels: string[]; verified?: boolean }>()
let seq = 0

const verifyFail: Step[] = [
  s(200, status('검증하는 중…')),
  s(300, tool('check', '방향 검증', '5개 기준', 'run', '공고 연관성을 보는 중')),
  s(1200, { type: 'tool', id: 'check', action: '방향 검증', target: '5개 기준', state: 'err' }),
  ask({ ...numbered('ph2x-verify', '검증을 통과하지 못했어요. 다른 방향으로 다시 고를까요?', ['다시 고르기', '그만하기']), foot: undefined }),
]
const autoPick: Step[] = [
  s(300, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개', JD_LINES)),
  s(400, agent('auto1', '자동으로 골랐어요: 모던 템플릿')),
  s(400, agent('auto2', '자동으로 골랐어요: 경력 섹션부터 고치기')),
  s(300, tool('pdf', 'PDF 만들기', '모던 템플릿', 'ok', FILE_PAGE)),
  done,
]
const awaitReply: Step[] = [
  s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건')),
  s(400, agent('await', '경력 섹션을 이렇게 바꿀게요. 승인 API 성과를 숫자로 보여 주고, Kafka 경험을 맨 앞으로 옮겨요.')),
  awaitingDone,
]
const fail = (id: string, code: string, text: string): Step[] => [s(300, { type: 'error', id, text, code })]

// Words only the tours type: they pick a scenario that the design draws but a plain message would not reach.
const TOKENS: Record<string, Step[]> = {
  'err-unavailable': fail('err', 'NOT_CONFIGURED', ERROR_TEXT.NOT_CONFIGURED!),
  'err-credit': fail('err', 'INSUFFICIENT_CREDITS', ERROR_TEXT.INSUFFICIENT_CREDITS!),
  'err-other': [s(300, agent('hi', '좋아요. 공고와 이력서를 비교해서 맞춤 초안을 만들어 볼게요.')), s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')), ...fail('err', 'UNKNOWN', DEFAULT_ERROR_TEXT)],
  'ext-done': ext({}),
  'ext-nojob': ext({ todo: ['이력서 읽기', '고칠 점 찾기', '경력 섹션 고치기', 'PDF로 만들기'], text: '다 됐어요! 이력서를 고쳤어요.', fileName: '김서준_백엔드_이력서_수정본.pdf', job: false }),
  'ext-nosave': ext({ saved: false }),
  'ext-ok': ext({ josa: '으로', gate: '내 서류에 저장했어요. 결과를 확인할까요?' }),
  'ext-fail': ext({ josa: '으로', saved: false, gate: '내 서류에 저장하지 못했어요. 결과를 확인할까요?' }),
  'ph1-free': ph1Plan('FREE'),
  'ph1-ultra': ph1Plan('ULTRA'),
  // The open gate hides the chat from accessibility, so hold it back until a tour has tapped the card open.
  'ph1-ultra-open': ph1Plan('ULTRA', DWELL + 4000),
  'auto-pick': autoPick,
  // Jump straight to a phase: the design draws each phase under its own user line.
  analyze: ph1,
  boost: ph3Boost,
  // ChatPh4Quality draws the quality check right under this line, without the boost card.
  quality: ph4Quality,
  '품질 검사로 넘어가기': ph4Quality,
  'ph2x': ph2xApproach,
  '네, 시작해 주세요': ph1,
  '피드백만 받을게요': feedbackOnly,
  '좋아요, 계속해 주세요': ph3Boost,
  '필요한 프로젝트 경험까지 만들어 주세요': ph2xApproach,
}

const pick = (text: string, interrupted: boolean, attachment?: string, intent?: string): { steps: Step[]; labels?: string[] } | null => {
  // The Android keyboard capitalizes the first letter of a tour's typed English alias.
  const t = text.trim().toLowerCase()
  const token = TOKENS[t]
  if (token) return { steps: token }
  if (attachment) return { steps: fileRun() }
  if (intent === 'fit') return { steps: ph1 }
  if (intent === 'boost') return { steps: ph3Boost }
  if (intent === 'experience') return { steps: ph2xApproach }
  if (/지원해|^apply$/.test(t)) return { steps: applyRun }
  if (/저장해/.test(t)) return { steps: [s(300, tool('save', '내 서류에 저장', undefined, 'ok', '저장했어요 · 마이 › 서류')), done] }
  if (/실패|채용 페이지|^fail$/.test(t)) return { steps: failRun, labels: TODO }
  if (/만들어 주세요|^make resume$/.test(t)) return { steps: ph0 }
  if (/pdf로 만들어 줘/.test(t)) return { steps: autoPick }
  if (/경력 섹션을 공고에 맞게/.test(t)) return { steps: awaitReply }
  if (interrupted) return null
  if (/맞춰|고쳐|^tailor/.test(t)) return { steps: [...tailorRead, ...tailorFit(TODO)], labels: TODO }
  return { steps: generic(text) }
}

mock('POST', 'chat/runs', ({ body }) => {
  const b = body as RunInput
  const id = b.conversationId
  let steps: Step[]
  let state = scenario.get(id)
  if (b.answer && state) {
    // The first 병목 강도 pick fails verification (ChatVerifyFail); picking again passes.
    const verifying = b.answer.approvalId === 'ph2x-level' && b.answer.choice !== 3 && !state.verified
    if (verifying) state.verified = true
    steps = verifying ? verifyFail : (next[b.answer.approvalId] ?? ((_c: number) => generic(b.text ?? '')))(b.answer.choice, state.labels)
  } else if (!state && find(id)?.status === 'RUNNING') {
    state = { prefix: `r${++seq}`, labels: TODO }
    scenario.set(id, state)
    steps = startDocument
  } else if (b.interrupted && state && !pick(b.text ?? '', true, undefined, b.intent)) {
    // Talking after 중지 resumes the stopped work with the new request folded in (ChatInterrupt).
    // Fresh ids: the stopped lines stay in the transcript and the resumed work continues below them.
    state = { prefix: `r${++seq}`, labels: TODO_PLUS }
    scenario.set(id, state)
    steps = tailorResume
  } else {
    const p = pick(b.text ?? '', false, b.attachment, b.intent)!
    state = { prefix: `r${++seq}`, labels: p.labels ?? TODO }
    scenario.set(id, state)
    steps = p.steps
  }
  const prefix = state!.prefix
  const out = steps.map((st) => ('id' in st.event ? { ...st, event: { ...st.event, id: `${prefix}-${st.event.id}` } as ChatEvent } : st))

  const c = find(id)
  if (c) {
    const last = out[out.length - 1]?.event
    const line = [...out].reverse().find((x) => x.event.type === 'agentText')?.event as { text?: string } | undefined
    c.status = last?.type === 'approval' ? 'NEEDS_APPROVAL' : null
    c.lastLine = last?.type === 'approval' ? last.approval.question : (line?.text ?? '').replace(/\*\*/g, '')
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

mock('GET', 'conversations/:id/turns', ({ params, query }) => {
  const c = find(params.id!)
  const events = c && storedTurns[c.id]
  const turns: ConversationTurn[] = events
    ? [{ jobId: `${c.id}-j`, status: 'DONE', createdAt: c.updatedAt, userMessageId: c.id === 'c-dotori' ? null : `${c.id}-u`, assistantMessageId: null, answer: null, events }]
    : []
  return page(turns, query)
})
// Restored cards carry server option ids; the mock has no job to resume, so answering just records it.
mock('POST', 'conversations/:id/approvals/:approvalId', ({ params, body }) => {
  delete storedTurns[params.id!]
  const c = find(params.id!)
  if (c) Object.assign(c, { status: null, lastLine: '' })
  return { data: { id: params.approvalId, status: 'APPROVED', optionId: (body as { optionId: string }).optionId } }
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
  const live = links.filter((l) => !deletedLinks.has(l.id))
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
mock('GET', 'chat/docs', () => ({ data: docs }))
mock('POST', 'chat/docs', ({ body }) => {
  const b = body as { fileName: string; size: number }
  const d: ChatDoc = { id: `d${Date.now()}`, fileName: b.fileName, size: b.size, createdAt: new Date().toISOString() }
  docs.unshift(d)
  return { status: 201, body: { data: d } }
})
mock('GET', 'chat/account', () => ({ data: { email: 'seojun.kim@gmail.com', plan: 'PRO', credits: { used: 3200, total: 5000 } } }))

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
  // The design draws the job as one "company · title" line, so it has no overline.
  boost: { items: [{ ...JOBS[0]!, over: '', title: '모아페이 · 백엔드 엔지니어 (Kotlin·Spring)', sub: '', selected: true }], doc: RESUME },
  deadline: {
    items: [
      job('d-pado', '파도AI', '데이터 분석가', '', '파', '#862E9C', { badge: { label: 'D-2', tone: 'red' }, note: { label: '서류 없음' } }),
      job('d-dotori', '도토리증권', '서버 개발자 (Go)', '', '도', '#343A40', { badge: { label: 'D-4', tone: 'red' }, note: { label: '서류 준비됨', ac: true } }),
      job('d-green', '그린티켓', '그로스 마케터', '', '그', '#E67700', { badge: { label: 'D-6', tone: 'orange' }, note: { label: '서류 없음' } }),
      job('d-saebyuk', '새벽마켓', 'ML 엔지니어', '', '새', '#C2255C', { badge: { label: 'D-7', tone: 'orange' }, note: { label: '초안 있음' } }),
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

