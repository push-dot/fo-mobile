// Scripted runs of the chat mock, written as the frames push-be streams (StreamEvent of @push/api-client).
// The app plays them through the same mapper as a live stream, so a run draws what the server's frames would draw.
// Converted from the reducer-event scripts by scripts/mock-wire-frames.cjs. Edit the frames here from now on.
import type { StreamEvent } from '@push/api-client'
import { GATED_STEP, HINTLESS_GATES, READ_OFF_TEXT } from '../../features/chat/constants'
import { STATUS_STEPS } from '../../features/chat/utils/status-line'
import type { Step } from '../../features/chat/types'
import { PAGE_READ_FOOT, PAGE_READ_OPTIONS } from './cards'

type Frame = Step['frame']
type Card = Extract<StreamEvent, { type: 'choice' | 'approval' }>
type Choice = Extract<Card, { type: 'choice' }>
type Tool = Extract<StreamEvent, { type: 'tool' }>

const s = (wait: number, frame: Frame): Step => ({ wait, frame })
const status = (text: string): Frame => ({ type: 'status', text })
const agent = (text: string): Frame => ({ type: 'token', text })
/** A choice the run made by itself: the app draws "자동으로 골랐어요: {label}". */
const autoPicked = (id: string, label: string): Frame => ({ type: 'choice', id, auto: true, options: [{ id: 'pick', label }], recommended: 'pick' })
const tool = (name: string, summary: string, target: string | undefined, state: Tool['state'], resultLine?: string, extra?: string[]): Tool => ({
  type: 'tool', name, summary, state, ...(target ? { target } : {}), ...(resultLine ? { resultLine } : {}), ...(extra ? { extra } : {}),
})
const todo = (id: string, labels: string[], done: number, added = -1): Frame => ({
  type: 'todo',
  id,
  items: labels.map((text, i) => ({ id: String(i), text, state: i < done ? 'done' : i === done || i === added ? 'now' : 'todo', ...(i === added ? { added: true } : {}) })),
})
const ask = (card: Card) => s(500, card)
/** A numbered card. Its option ids are the positions the scripts branch on. */
const numbered = (id: string, title: string, labels: string[], selected = 0): Choice => ({
  type: 'choice',
  id,
  title,
  options: labels.map((label, i) => ({ id: String(i), label })),
  ...(selected ? { recommended: String(selected) } : {}),
})
/** A tool asking permission: the server's line under the options ("지원하면 취소할 수 없어요") replaces the hint. */
const confirm = (card: Choice, foot: string): Card => ({ type: 'approval', id: card.id, kind: 'TOOL_ACTION', title: card.title!, options: card.options, foot })
/** The closing line above a result card. The app bolds the score change it reads from fitFrom and fitTo. */
const closing = (text: string, bullets?: string[]) => {
  const change = /\*\*(\d+\.\d) → (\d+\.\d)\*\*/.exec(text)
  return { summary: text.replaceAll('**', ''), ...(change ? { fitFrom: Number(change[1]), fitTo: Number(change[2]) } : {}), ...(bullets ? { bullets } : {}) }
}
const done = s(200, { type: 'done', operation: null })
const awaitingDone = s(200, { type: 'done', operation: null, awaiting: 'approval' })
// The document every scripted edit and draft changes (마이 › 서류 d1).
const DOC = 'd1'

export const RESUME = '김서준_백엔드_이력서_2026.pdf'
export const MOA = '모아페이 · 백엔드 엔지니어'
export const PROFILE_TODO = ['프로필 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', '프로필에 저장']
export const TODO = ['이력서 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', 'PDF로 만들기']
const FILE_TODO = TODO
export const PROFILE_TASK = '프로필 수정 · Push 프로필 · 경력'
const FILE_PAGE = 'A4 1쪽 · 186KB'
const FILE_SAVED = '내 서류에 자동 저장됨'
export const TODO_PLUS = ['이력서 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', '자기소개서 초안 쓰기', 'PDF로 만들기']
const BULLETS = ['승인 API 성과를 숫자로 보여 줬어요', 'Kafka를 기술 스택 맨 앞으로 옮겼어요', '동아리 활동은 한 줄로 줄였어요']
// Hold a running line this long so a screenshot can catch it.
const DWELL = 8000
const JD_RUN_HOLD = 20_000
// The stop lines of ChatPh3BoostStop stay alone this long before the quality check opens its card, which hides the chat from accessibility.
const BEFORE_QUALITY = 20_000
// ChatPh4Quality: the card opens after the tour has typed the line and lowered the keyboard (a card that opens over the raised keyboard comes up blank).
const QUALITY_LATER = 15_000
const after = (steps: Step[], ms: number): Step[] => steps.map((st, i) => (i === 0 ? { ...st, wait: ms } : st))
// Android taps wait up to 10s for a running line's spinner to settle, so a tour that acts while one runs needs far more than DWELL.
const HOLD = 150_000
export const JD_LINES = ['필수 · Kotlin 또는 Java 4년 이상', '필수 · Spring Boot 운영', '필수 · RDBMS 설계와 튜닝', '필수 · 대용량 트래픽 처리', '필수 · 결제·정산 도메인 이해', '우대 · Kafka · 장애 대응 · MSA']

const tailorRead: Step[] = [
  s(200, status('훑어보는 중…')),
  s(700, agent('좋아요. 공고와 이력서를 비교해서 맞춤 초안을 만들어 볼게요.')),
  s(400, todo('todo', TODO, 0)),
  s(300, tool('resume', '이력서 읽기', RESUME, 'run', '쪽마다 읽는 중')),
  s(1400, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  s(200, todo('todo', TODO, 1)),
  s(200, tool('jd', '공고 읽기', MOA, 'run', '필수·우대 요건을 뽑는 중')),
  s(1500, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개', JD_LINES)),
]

// 마이 › 서류 › Bot으로 고치기 has no posting yet: the run starts by reading the file, before any plan or todo (DocAgentNew).
const fixDocRun: Step[] = [
  s(200, status('서류를 읽는 중')),
  s(300, tool('resume', '이력서 읽기', RESUME, 'run', '서류를 읽는 중')),
  s(HOLD, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  done,
]

const tailorFit = (labels: string[], added = -1, hold = DWELL): Step[] => [
  s(200, todo('todo', labels, 2, added)),
  // The status line draws the status frame, not the tool's result line (ChatStates.3 reads "기술 스택을 비교하는 중 14초").
  s(100, status(added < 0 ? '기술 스택을 비교하는 중' : '경력 수준을 비교하는 중')),
  s(200, tool('fit', '적합도 계산', added < 0 ? '5개 항목' : '이어서', 'run', added < 0 ? '기술 스택을 비교하는 중' : '경력 수준을 비교하는 중')),
  s(hold + 1300, tool('fit', '적합도 계산', '5개 항목', 'ok', '6.9점 · 키워드와 도메인이 약해요')),
  s(300, {
    type: 'fit',
    score: 8.1,
    from: 6.9,
    delta: '+1.2 예상',
    parts: { techStack: 7.5, experienceLink: 8.2, keyword: 4.5 },
  }),
  s(400, todo('todo', labels, 3, added)),
  s(500, agent('경력 섹션부터 공고에 맞게 고쳐 볼게요.')),
  s(300, status('끄적이는 중…')),
  s(1200, tool('edit', '이력서 수정', '경력 · 모아페이', 'wait', '2줄 추가, 1줄 삭제')),
  s(200, {
    type: 'diff', documentId: DOC, revisionId: 'diff',
    hunks: [
      { line: 12, sign: '', text: '모아페이 · 백엔드 엔지니어 · 2022.03–현재' },
      { line: 13, sign: '-', text: '결제 API 개발 및 운영' },
      { line: 13, sign: '+', text: '결제 승인 API를 Kotlin·Spring으로 재설계, p95 응답 320ms → 140ms' },
      { line: 14, sign: '+', text: 'Kafka 이벤트 파이프라인으로 정산 지연을 하루에서 10분으로 단축' },
      { line: 15, sign: '', text: '결제 장애 대응 매뉴얼 작성' },
    ],
  }),
  ask({
    type: 'approval',
    id: 'tailor-apply',
    kind: 'DOCUMENT_EDIT',
    title: '이 수정을 적용할까요?',
    documentId: DOC,
    options: [{ id: 'apply', label: '적용' }, { id: 'keep', label: '그대로 두기' }],
  }),
]

// What the mapper makes of the server's result frame: the task line, the summary, then the card.
// The done boards draw the finished task line above the to-do card, so it comes first when the card is new to the thread.
const TASK_RESULT = '반영했어요 · 2줄 추가, 1줄 삭제'
const profileDone = (wait: number, score: string, josa: string, bullets?: string[]): Step[] => [
  s(wait + 200, {
    type: 'result',
    source: 'profile',
    taskLine: '',
    checklist: PROFILE_TODO,
    name: '김서준',
    headline: '백엔드 엔지니어',
    title: '김서준 · 백엔드 엔지니어',
    subtitle: 'Push 프로필 · 방금 수정',
    documentId: 'd1',
    company: '모아페이',
    actions: [{ id: 'apply', label: '모아페이에 바로 지원하기' }],
    ...closing(`다 됐어요! 적합도를 **${score}**${josa} 올렸어요.`, bullets),
  }),
]
const profileCard = (score: string, josa = '로'): Step[] => [
  s(400, tool('task', '프로필 수정', 'Push 프로필 · 경력', 'ok', TASK_RESULT)),
  s(200, todo('todo', PROFILE_TODO, PROFILE_TODO.length)),
  ...profileDone(200, score, josa, BULLETS),
]
const present = ask({ ...numbered('present', 'Push 프로필에 저장했어요. 결과를 확인할까요?', ['확인했어요', '그만하기']), note: 'PDF는 Push 프로필에서 내보낼 수 있어요.' })
const finish = (score: string, josa = '로'): Step[] => [...profileCard(score, josa), present, awaitingDone]

// Upload scenarios (ChatDone, ChatDoneNoJob, ChatDoneSaveFail, ChatPh6ResultFile, ChatPh6ResultFail).
const EXT_FILE = '김서준_모아페이_백엔드.pdf'
const ext = (o: { todo?: string[]; text?: string; fileName?: string; saved?: boolean; job?: boolean; gate?: string; josa?: string }): Step[] => {
  const labels = o.todo ?? FILE_TODO
  const job = o.job ?? true
  const saved = o.saved ?? true
  return [
    // The gate boards (ChatPh6ResultFile, ChatPh6ResultFail) draw only the closing line and the card, no task lines or bullets.
    ...(o.gate
      ? []
      : [
          s(200, tool('task', '이력서 수정', '올린 파일 · 경력', 'ok', TASK_RESULT)),
          s(200, tool('pdf', 'PDF 만들기', '모던 템플릿', 'ok', FILE_PAGE)),
          s(200, todo('todo', labels, labels.length)),
        ]),
    s(500, {
      type: 'result',
      source: 'external',
      taskLine: '',
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
      ...closing(o.text ?? `다 됐어요! 적합도를 **6.9 → 8.1**${o.josa ?? '로'} 올렸어요.`, o.gate ? undefined : BULLETS),
    }),
    // No done event while the gate is open, so no 작업했어요 footer under the card.
    ...(o.gate ? [ask(numbered('ext-gate', o.gate, ['확인했어요', '그만하기']))] : [done]),
  ]
}
const fileRun = (): Step[] => ext({})

const tailorDone = (labels: string[]): Step[] => [
  s(300, todo('todo', labels, labels.length - 1)),
  s(200, status('Push 프로필에 저장하는 중…')),
  s(200, todo('todo', labels, labels.length)),
  ...finish('6.9 → 8.1'),
]

export const tailorResume: Step[] = [
  s(200, { type: 'think', seconds: 6, phase: 'think' }),
  s(600, agent('알겠어요. 할 일에 자기소개서를 넣고, 멈춘 곳부터 이어서 할게요.')),
  s(300, status('다시 맞춰보는 중…')),
  ...tailorFit(TODO_PLUS, 4, HOLD),
]

const failRun: Step[] = [
  s(200, status('훑어보는 중…')),
  s(300, tool('resume', '이력서 읽기', RESUME, 'run', '쪽마다 읽는 중')),
  s(1200, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건')),
  s(200, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'run', '저장소를 훑는 중')),
  s(2000, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'wait', '시간이 오래 걸려서 한 번 더 시도했어요 · 저장소 3개만 읽었어요')),
  s(200, tool('jd', '공고 읽기', '회사 채용 페이지', 'run', '본문을 읽는 중')),
  s(1500, { ...tool('jd', '공고 읽기', '회사 채용 페이지', 'err'), result: { error: '“자격 요건”을 읽지 못했어요 · 로그인이 필요한 영역이에요' } }),
  s(400, agent('나머지 내용으로 진행할 수 있지만, 자격 요건이 빠지면 적합도가 정확하지 않을 수 있어요.')),
  ask(numbered('fail-choice', '어떻게 할까요?', ['공고 내용을 붙여넣을게요', '이대로 진행해 주세요', 'Push 공고에서 고를게요'])),
]

const say = (text: string): Step[] => [s(600, agent(text)), done]

// Phase boards ChatPh0 … ChatPh6Apply as one guided flow.
const ph0: Step[] = [
  s(300, status('생각하는 중…')),
  s(600, agent('좋아요! 시작하기 전에 하나만 여쭤볼게요.')),
  ask(numbered('ph0', '어떤 방식으로 진행할까요?', ['이력서부터 쓸게요', '경험부터 정리할게요', '그만하기'])),
]
const ph0Input: Step[] = [
  s(500, agent('Push에 있는 자료부터 찾아볼게요.')),
  s(300, tool('find', '자료 찾기', '마이 › 서류 · 북마크 공고', 'run', '서류와 북마크를 훑는 중')),
  s(1200, tool('find', '자료 찾기', '마이 › 서류 · 북마크 공고', 'ok', '이력서 3개 · 북마크 공고 2개 · GitHub 링크 1개')),
  ask({
    type: 'choice',
    id: 'ph0-input',
    title: '어떤 산출물을 만들까요?',
    options: [{ id: 'cancel', label: '그만하기' }],
    sections: [
      { kind: 'chips', id: 's0', multiple: true, options: [{ id: 's0.0', label: '이력서' }, { id: 's0.1', label: '포트폴리오' }, { id: 's0.2', label: '자기소개서' }], selected: ['s0.0'] },
      {
        kind: 'rows',
        id: 's1',
        title: '가져올 자료',
        options: [
          { id: 's1.0', label: RESUME, sub: '마이 › 서류', badge: 'PDF', action: 'change' },
          { id: 's1.1', label: '백엔드 엔지니어 (Kotlin·Spring)', sub: '홈 › 북마크 공고', badge: '모', action: 'change' },
          { id: 'm_github', label: 'github.com/seojun-kim', sub: '이력서에서 찾았어요', action: 'change' },
        ],
      },
      { kind: 'chips', id: 's2', title: '어떤 말투로 쓸까요?', options: [{ id: 's2.0', label: '전문적으로' }, { id: 's2.1', label: '자신 있게' }, { id: 's2.2', label: '짧게' }, { id: 's2.3', label: '기술 중심으로' }, { id: 's2.4', label: '협업 중심으로' }, { id: 's2.5', label: '원래 말투로' }], selected: ['s2.5'] },
    ],
    submit: { label: '이대로 진행' },
  }),
]
const ph0Start: Step[] = [
  s(400, tool('input', '입력 정리', undefined, 'ok', `이력서 **${RESUME}**\n공고 **${MOA}**\nGitHub **github.com/seojun-kim** · 말투 **그대로**`)),
  ask(numbered('ph0-start', '이대로 분석을 시작할까요?', ['네, 시작해 주세요', '자료를 바꿀래요', '그만할게요'])),
]
// The analysis card by plan: FREE locks the part rows, PRO teases ULTRA, ULTRA unfolds the projection.
const ph1Fit = (plan: 'FREE' | 'PRO' | 'ULTRA', gateWait = 500): Step[] => [
  s(300, {
    type: 'fit',
    score: 6.9,
    band: '보통 · 개선 여지 있어요',
    plan,
    summary: '기술 스택은 잘 맞아요. 키워드와 정산 도메인이 약해요.',
    parts: { techStack: 7.5, experienceLink: 7.0, careerLevel: 8.0, keyword: 4.5, domain: 5.0 },
    keywords: [
      { label: 'Kotlin', ok: true }, { label: 'Spring Boot', ok: true }, { label: 'JPA', ok: true },
      { label: 'Kafka', ok: false }, { label: '정산 도메인', ok: false },
    ],
    ...(plan === 'ULTRA' ? { projected: { score: 8, label: '8점대', bullets: ['승인 API 성과를 숫자로 보여 주기', 'Kafka를 기술 스택 맨 앞으로 옮기기', '정산 도메인 경험을 한 줄 추가하기'] } } : {}),
  }),
  { ...ask(numbered('ph1-fit', '이 공고에 맞춰 이력서를 고칠까요?', ['네, 맞춰서 고쳐 주세요', '피드백만 받을게요', '점수만 보고 끝낼게요'])), wait: gateWait },
]
const ph1Plan = (plan: 'FREE' | 'ULTRA', gateWait?: number): Step[] => [
  s(200, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'ok', '6.9점')),
  ...ph1Fit(plan, gateWait),
]
export const PH1 = ['이력서 읽기', 'GitHub 살펴보기', '공고 분석', '적합도 계산']
const ph1: Step[] = [
  s(200, status('훑어보는 중…')),
  s(300, todo('todo1', PH1, 0)),
  s(200, tool('resume', '이력서 읽기', RESUME, 'run', '쪽마다 읽는 중')),
  s(1300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  s(200, todo('todo1', PH1, 1)),
  s(200, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'run', '저장소를 훑는 중')),
  s(1500, tool('gh', 'GitHub 살펴보기', 'seojun-kim', 'ok', '저장소 12개 중 공고 관련 3개', ['payment-retry-lab', 'settle-pipeline', 'kotlin-ledger'])),
  s(300, agent('이력서에 없는 저장소 **payment-retry-lab**을 찾았어요. 경험으로 넣을지 분석이 끝나면 여쭤볼게요.')),
  s(200, todo('todo1', PH1, 2)),
  // ChatPh1 draws this as the working line (status frame), as the tailor run does for 기술 스택을 비교하는 중.
  s(200, status('필수·우대 스택을 뽑는 중')),
  s(100, tool('jd', '공고 읽기', MOA, 'run', '필수·우대 스택을 뽑는 중')),
  // The running line is what ChatPh1 draws; a tour needs a few seconds after its own steps to find it below the fold.
  s(JD_RUN_HOLD, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개', JD_LINES)),
  s(200, todo('todo1', PH1, 3)),
  s(200, status('맞춰보는 중…')),
  s(200, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'run', '항목별 점수를 내는 중')),
  s(1500, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'ok', '6.9점')),
  s(200, todo('todo1', PH1, 4)),
  ...ph1Fit('PRO'),
]
const feedbackOnly: Step[] = [
  s(300, tool('fbt', '피드백 정리', '공고 요건 ↔ 내 이력서', 'ok', '고칠 점 3개')),
  s(400, agent('이 공고 기준으로 고칠 점이에요.')),
  s(300, {
    type: 'plan',
    id: 'feedback',
    title: '',
    meta: '',
    rows: [
      { tag: '키워드', label: 'Kafka, 정산 배치가 없어요', note: '경험 문장에 직접 넣어 주세요' },
      { tag: '도메인', label: '정산 경험이 약해 보여요', note: 'payment-retry-lab을 정산 맥락으로 써 주세요' },
      { tag: '성과', label: '숫자가 부족해요', note: '승인 API 개선 결과를 수치로 보여 주세요' },
    ],
    keywords: [],
  }),
  ask(numbered('feedback', '피드백을 반영해서 수정할까요?', ['반영해서 수정할게요', '그만하기'])),
]
export const startDocument: Step[] = [
  s(400, agent('작성 중인 이력서 초안(v1)이 있어요.')),
  ask(numbered('start-document', '이어서 작성할까요?', ['이어서 작성하기', '그만하기'])),
]
const ph2: Step[] = [
  s(200, status('궁리하는 중…')),
  s(200, tool('strategy', '전략 세우기', '공고 요건 ↔ 내 경력', 'run', '섹션마다 할 일을 정하는 중')),
  s(1500, tool('strategy', '전략 세우기', '공고 요건 ↔ 내 경력', 'ok', '섹션 5개 · 추가할 키워드 4개')),
  s(300, {
    type: 'plan',
    id: 'strategy',
    title: '수정 전략',
    meta: '섹션 5개',
    rows: [
      { tag: '강화', label: '경력 · 모아페이', note: '대용량 결제 요구 → 승인 API 성과를 숫자로' },
      { tag: '수정', label: '기술 스택', note: 'Kafka 경험을 맨 앞으로' },
      { tag: '추가', label: '프로젝트 · payment-retry-lab', note: '우대 사항 “장애 대응” 근거' },
      { tag: '축소', label: '사내 동아리 활동', note: '공고와 연관이 낮아요' },
    ],
    keywords: ['결제 승인', '정산 배치', 'Kafka', '장애 대응'],
  }),
  ask(numbered('ph2', '이 전략대로 초안을 쓸까요?', ['초안 쓸게요', '피드백만 볼게요', '그만하기'])),
]
const PH3 = ['요약', '경력', '프로젝트', '기술 스택', '학력']
const ph3Open: Step[] = [
  s(200, status('끄적이는 중…')),
  s(200, todo('todo3', PH3, 1)),
  // ChatPh3 draws this as the working line (status frame), as ph1 does for 필수·우대 스택을 뽑는 중.
  s(100, status('경력 섹션을 쓰는 중')),
  s(100, tool('draft', '초안 쓰기', '이력서 v1 · 경력', 'run', '경력 섹션을 쓰는 중')),
]
const paper = s(300, {
  type: 'paper', id: 'paper', label: '이력서 초안 v1', heading: '김서준 · 백엔드 개발자',
  lines: ['모아페이 · 백엔드 엔지니어 · 2022.03–현재', '• 결제 승인 API를 Kotlin·Spring으로 재설계, p95 응답 320ms → 140ms', '• Kafka 기반 결제 이벤트 파이프라인을 구축해 정산 지연을'],
})
const ph3Rest = (wait: number): Step[] => [
  s(wait, todo('todo3', PH3, 3)),
  s(1200, todo('todo3', PH3, 5)),
  s(300, tool('draft', '초안 쓰기', '이력서 v1', 'ok', '1쪽 · 섹션 5개 · 말투 그대로')),
  s(200, {
    type: 'diff', documentId: DOC, revisionId: 'diff3',
    hunks: [
      { line: null, sign: '+', text: '승인 API 성과를 숫자로 강조' },
      { line: null, sign: '+', text: '프로젝트 payment-retry-lab 추가' },
      // push-be has no moved sign: a line removed and added back with the same text is the board's "~" line.
      { line: null, sign: '-', text: 'Kafka를 기술 스택 맨 앞으로' },
      { line: null, sign: '+', text: 'Kafka를 기술 스택 맨 앞으로' },
      { line: null, sign: '-', text: '사내 동아리 활동 세부 내용' },
    ],
  }),
  ask(numbered('ph3-review', '첫 번째 초안(v1)이에요. 이대로 검토할까요?', ['검토할게요', '그만하기'])),
]
// ChatPh3Review goes from the 초안 쓰기 line straight to the diff, with no draft card between.
const ph3: Step[] = [...ph3Open, ...ph3Rest(DWELL)]
// ChatPh3 draws the writing state (to-do 1/5, the streaming draft card), so the run holds on it long enough to shoot.
const ph3Writing: Step[] = [...ph3Open, paper, ...ph3Rest(HOLD)]
const ph3Boost: Step[] = [
  s(200, status('점수 올리는 중…')),
  s(200, tool('boost1', '점수 올리기 1회', '키워드 밀도', 'run', '키워드를 넣는 중')),
  s(1300, tool('boost1', '점수 올리기 1회', '키워드 밀도', 'ok', '6.9 → 7.8 · 결제 승인, 정산 배치 키워드를 넣었어요')),
  s(200, tool('boost2', '점수 올리기 2회', '도메인 경험', 'run', '도메인 맥락을 다시 쓰는 중')),
  s(1300, tool('boost2', '점수 올리기 2회', '도메인 경험', 'ok', '7.8 → 8.3 · payment-retry-lab을 정산 맥락으로 다시 썼어요')),
  s(300, {
    type: 'fit',
    score: 8.3,
    from: 6.9,
    delta: '+1.4',
    note: '적합도 6.9 → 8.3 (+1.4)',
  }),
  ask(numbered('ph3-boost', '점수를 한 번 더 올릴까요?', ['한 번 더 올리기', '여기서 멈추기', '그만하기'])),
]
const ph4Quality: Step[] = [
  s(200, status('검사하는 중…')),
  s(300, tool('qa', '품질 검사', '오타 · 문법 · 말투 · ATS', 'run', '문장을 하나씩 보는 중')),
  s(1200, tool('qa', '품질 검사', '오타 · 문법 · 말투 · ATS', 'ok', '바로 고친 것 2개 · 추천 3개')),
  s(200, {
    type: 'diff', documentId: DOC, revisionId: 'qdiff',
    hunks: [
      { line: 8, sign: '-', text: '결제 트랜젝션 처리 성능 개선' },
      { line: 8, sign: '+', text: '결제 트랜잭션 처리 성능 개선' },
      { line: 12, sign: '-', text: '모아페이 · 2022.04–현재' },
      { line: 12, sign: '+', text: '모아페이 · 2022.03–현재' },
    ],
  }),
  ask({
    type: 'choice',
    id: 'ph4-quality',
    title: '추천 수정도 반영할까요?',
    options: [],
    sections: [
      { kind: 'toggle', id: 's0', options: [{ id: 'dots', label: '가운데점(·) 나열을 쉼표로' }, { id: 'tense', label: '경력 본문의 현재형 문장 2곳' }, { id: 'tone', label: '말투 통일하기', desc: '“~했음”과 “~했습니다”가 섞였어요' }], selected: ['dots', 'tense'] },
    ],
    submit: { label: '{n}개 반영하고 디자인으로', zeroLabel: '그대로 디자인으로' },
  }),
]
const ph4Design: Step[] = [
  s(300, tool('applied', '추천 수정 반영', '2개', 'ok', '쉼표 정리 · 현재형 문장 고침')),
  s(400, agent('템플릿을 골라 주세요. 처음이라면 클래식을 추천해요.')),
  ask({
    type: 'choice',
    id: 'ph4-design',
    title: '검증을 마쳤어요. 어떤 디자인을 적용할까요?',
    options: [{ id: 'cancel', label: '그만하기' }],
    recommended: 't0',
    sections: [
      { kind: 'thumbnails', id: 's0', options: [{ id: 't0', label: '클래식' }, { id: 't1', label: '모던' }, { id: 't2', label: '컴팩트' }, { id: 't3', label: 'ATS' }], selected: ['t0'] },
      { kind: 'toggle', id: 's1', options: [{ id: 'photo', label: '프로필 사진 넣기' }], selected: [] },
    ],
    submit: { label: '클래식으로 만들기', optionLabels: { t0: '클래식으로 만들기', t1: '모던으로 만들기', t2: '컴팩트로 만들기', t3: 'ATS로 만들기' } },
  }),
]
const ph5: Step[] = [
  s(200, status('정리하는 중…')),
  s(300, tool('design', '디자인 적용', '모던', 'ok', 'A4 1쪽 · 여백과 줄 간격 맞춤')),
  s(300, tool('photo', '프로필 사진', '마이 › 프로필', 'ok', '헤더 왼쪽 원형 80px')),
  s(300, tool('save', 'Push 프로필', '마이 › 프로필', 'run', 'Push 프로필에 저장하는 중…')),
  // Tool lines are not drawn, so ChatPh5's status line needs its own frame (tailorDone does the same).
  s(200, status('Push 프로필에 저장하는 중…')),
  s(HOLD, tool('save', 'Push 프로필', '마이 › 프로필', 'ok', '저장했어요')),
]
const ph2xApproach: Step[] = [
  s(200, status('공고 뜯어보는 중…')),
  s(300, tool('jd', '공고 분석', MOA, 'run', '필수 스택을 뽑는 중')),
  s(1300, tool('jd', '공고 분석', MOA, 'ok', '필수 스택 5개 · 서비스 도메인: 결제·정산')),
  s(400, agent('공고에 필요한 경험을 만들 방향을 골라 주세요.')),
  ask(numbered('ph2x-approach', '어떤 접근 방식으로 진행할까요?', ['병목을 만들게요', '문제를 예방할게요', '그만하기'])),
]
const ph2xLevel: Step[] = [
  ask(numbered('ph2x-level', '병목 강도를 어느 정도로 할까요?', ['가벼운 제약으로', '중간 제약으로', '강한 제약으로', '그만하기'], 1)),
]
const noPosting: Step[] = [
  s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  ...say('어떤 공고에 지원하실 건가요? 공고 링크를 보내 주시면 그 회사에 맞춰 고칠게요. 공고 없이 다듬기만 해도 돼요.'),
]
const PREVENT = ['성능', '보안', '확장성', '안정성', '유지보수', '데이터 무결성', '그만하기']
const ph2xPrevent: Step[] = [
  ask({ ...numbered('ph2x-prevent', '어떤 문제를 예방할까요?', PREVENT), multiple: true }),
]
const ph2xBlueprints: Step[] = [
  s(200, status('기획하는 중…')),
  s(300, tool('check', '방향 검증', '5개 기준', 'run', '공고 연관성을 보는 중')),
  s(1200, tool('check', '방향 검증', '5개 기준', 'ok', '공고 연관성·임팩트·실현 가능성 모두 통과')),
  s(300, {
    type: 'plan',
    id: 'strategy',
    title: '프로젝트 기획서',
    meta: '4개',
    rows: [
      { tag: '통과', label: '결제 승인 재시도 큐', note: '안정성 · Kotlin, Kafka' },
      { tag: '통과', label: '정산 배치 병렬화', note: '데이터 무결성 · Spring Batch' },
      { tag: '조건부', label: '결제 이벤트 아웃박스', note: '무결성 · Kafka, JPA' },
      { tag: '통과', label: '가맹점 API 레이트 리미터', note: '안정성 · Redis' },
    ],
    keywords: [],
  }),
  ask(numbered('ph2x-bp', '어떤 프로젝트를 구현할까요?', ['기획만 볼게요', '그만하기'])),
]

const applyRun: Step[] = [
  s(200, status('지원 준비하는 중…')),
  s(300, tool('save', '내 서류에 저장', undefined, 'run', '저장하는 중')),
  s(900, tool('save', '내 서류에 저장', undefined, 'ok')),
  s(300, tool('apply', '지원하기', MOA, 'wait', '확인을 기다리는 중')),
  ask(confirm(numbered('apply', '이 공고에 지원해요', ['실행', '취소']), '지원하면 취소할 수 없어요')),
]

export const generic = (text: string): Step[] => [
  s(200, status('정리하는 중…')),
  s(700, agent('알겠어요. 필요한 자료부터 살펴볼게요.')),
  s(300, tool('req', '요청 정리', text.length > 24 ? `${text.slice(0, 24)}…` : text, 'run', '할 일을 나누는 중')),
  s(1500, tool('req', '요청 정리', text.length > 24 ? `${text.slice(0, 24)}…` : text, 'ok', '할 일 3개로 나눴어요')),
  ...say('정리했어요. 더 필요한 게 있으면 말해 주세요.'),
]

/** Approval id → choice → next steps. */
export const next: Record<string, (choice: number, labels: string[]) => Step[]> = {
  'tailor-apply': (c, l) => (c === 0 ? tailorDone(l) : [s(200, tool('edit', '이력서 수정', '경력 · 모아페이', 'ok', '그대로 뒀어요')), ...say('이 수정은 적용하지 않았어요.')]),
  'fail-choice': (c) =>
    c === 0 ? say('공고 본문을 붙여넣어 주세요. 받는 대로 이어서 할게요.')
      : c === 1 ? tailorFit(TODO)
        : say('북마크한 공고 중에서 골라 주세요. @언급으로 불러올 수 있어요.'),
  present: (c) => (c === 0 ? [done] : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  ph0: (c) => (c === 0 ? ph0Input : c === 1 ? ph2xApproach : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph0-input': () => ph0Start,
  'ph0-start': (c) => (c === 0 ? ph1 : c === 1 ? ph0Input : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph1-fit': (c) => (c === 0 ? ph2 : c === 1 ? feedbackOnly : say('적합도는 6.9점이에요. 필요하면 언제든 고쳐 드릴게요.')),
  feedback: (c) => (c === 0 ? ph2 : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'start-document': (c) => (c === 0 ? say('멈춘 곳부터 이어서 할게요.') : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  ph2: (c) => (c === 0 ? ph3 : c === 1 ? say('피드백만 정리해 드릴게요. 초안은 쓰지 않았어요.') : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph3-review': (c) => (c === 0 ? ph3Boost : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph3-boost': (c) =>
    c === 0
      ? [s(400, agent('최대 5번까지 올렸어요.')), ...after(ph4Quality, BEFORE_QUALITY)]
      : c === 1
        ? ph4Quality
        : say('알겠어요. 필요할 때 다시 불러 주세요.'),
  'ph4-quality': () => ph4Design,
  'ph4-design': (c) => (c === -1 ? say('알겠어요. 필요할 때 다시 불러 주세요.') : [...ph5, ...finish('6.9 → 8.1', '으로')]),
  'ph2x-verify': (c) => (c === 0 ? ph2xLevel : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ext-gate': (c) => (c === 0 ? [done] : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph2x-approach': (c) => (c === 0 ? ph2xLevel : c === 1 ? ph2xPrevent : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph2x-level': (c) => (c === 3 ? say('알겠어요. 필요할 때 다시 불러 주세요.') : ph2xBlueprints),
  'ph2x-prevent': (c) => (c === 6 ? say('알겠어요. 필요할 때 다시 불러 주세요.') : ph2xBlueprints),
  'ph2x-bp': (c) => (c === 0 ? say('기획서 4개를 내 서류에 저장했어요.') : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  apply: (c) =>
    c === 0
      ? [s(300, tool('apply', '지원하기', MOA, 'ok', '지원했어요 · 마이 › 내 활동에 기록했어요')), ...say('지원했어요. 내 활동에서 진행 상황을 볼 수 있어요.')]
      : [s(300, tool('apply', '지원하기', MOA, 'ok', '지원하지 않았어요')), ...say('천천히 보고 말해 주세요.')],
}

export const verifyFail: Step[] = [
  s(200, status('검증하는 중…')),
  s(300, tool('check', '방향 검증', '5개 기준', 'run', '공고 연관성을 보는 중')),
  s(1200, tool('check', '방향 검증', '5개 기준', 'err')),
  ask({ ...numbered('ph2x-verify', '검증을 통과하지 못했어요. 다른 방향으로 다시 고를까요?', ['다시 고르기', '그만하기']), gate: HINTLESS_GATES[0] }),
]
const autoPick: Step[] = [
  s(300, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개')),
  s(400, autoPicked('auto1', '모던 템플릿')),
  s(400, autoPicked('auto2', '경력 섹션부터 고치기')),
  s(300, tool('pdf', 'PDF 만들기', '모던 템플릿', 'ok', FILE_PAGE)),
  done,
]
const statesFile: Step[] = [
  s(500, {
    type: 'result',
    source: 'external',
    taskLine: '',
    checklist: FILE_TODO,
    fileName: EXT_FILE,
    pageLine: FILE_PAGE,
    cardMeta: FILE_PAGE,
    documentId: 'src-upload',
    company: '모아페이',
    actions: [],
    ...closing('다 됐어요! 적합도를 **6.9 → 8.1**로 올렸어요.'),
  }),
  done,
]
const appliedRecord: Step[] = [
  s(300, tool('apply', '지원하기', MOA, 'run', EXT_FILE)),
  s(900, tool('apply', '지원하기', MOA, 'ok')),
  // The record is a line of its own (tool lines are not drawn), as ChatStates.4 shows it between the file card and the busy error.
  s(300, agent('지원했어요 · 마이 › 내 활동에 기록했어요')),
  done,
]
const awaitReply: Step[] = [
  s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건')),
  s(400, agent('경력 섹션을 이렇게 바꿀게요. 승인 API 성과를 숫자로 보여 주고, Kafka 경험을 맨 앞으로 옮겨요.')),
  awaitingDone,
]
export const fail = (code: string, details?: Record<string, unknown>): Step[] => [s(300, { type: 'error', error: { code, message: code, ...(details ? { details } : {}) } })]

// The company-bot status boards (ChatBotStatus*, ChatBotReadOff): one status line held, one card, or one finished answer.
const held = (text: string): Step[] => [s(200, status(text)), s(HOLD, { type: 'done', operation: null })]
// ChatBotStatusSteps: the 13 status lines one after the other. A tour shoots a line, then sends the mock link `step-next` for the next one,
// so no line depends on how long Maestro takes to read the screen (its waits end early or late).
const statusSteps: Step[] = [...STATUS_STEPS.map((text, i) => s(i ? GATED_STEP : 200, status(text))), s(GATED_STEP, { type: 'done', operation: null })]
const STATUS_ASK = '지원 동기 첫 문장을 어느 쪽으로 쓸까요?'
const statusHelp: Step[] = [
  ask({
    type: 'choice',
    id: 'st-help',
    title: STATUS_ASK,
    options: [
      { id: '0', label: '제품 관점', desc: '결제 경험을 사용자 입장에서 풀어요' },
      { id: '1', label: '데이터 관점', desc: '처리량과 지연 수치를 앞세워요' },
      { id: '2', label: '직접 입력할게요' },
    ],
  }),
  awaitingDone,
]
const statusApprove: Step[] = [
  ask({
    type: 'approval',
    id: 'st-approve',
    kind: 'TOOL_ACTION',
    title: '모아페이 채용 페이지를 열어도 될까요?',
    summary: 'careers.moapay.co.kr · 공고 1개를 읽어요',
    options: PAGE_READ_OPTIONS,
    foot: PAGE_READ_FOOT,
  }),
  awaitingDone,
]

// Words only the tours type: they pick a scenario that the design draws but a plain message would not reach.
export const TOKENS: Record<string, Step[]> = {
  'err-unavailable': fail('NOT_CONFIGURED'),
  // ChatBotStatusError: the run broke with a reason the app has no sentence for, so the status line carries it.
  'err-disconnect': fail('DISCONNECTED', { reason: '연결 끊김' }),
  'err-credit': fail('INSUFFICIENT_CREDITS'),
  'err-other': [s(300, agent('좋아요. 공고와 이력서를 비교해서 맞춤 초안을 만들어 볼게요.')), s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')), ...fail('UNKNOWN')],
  'ext-done': ext({}),
  'ext-nojob': ext({ todo: ['이력서 읽기', '고칠 점 찾기', '경력 섹션 고치기', 'PDF로 만들기'], text: '다 됐어요! 이력서를 고쳤어요.', fileName: '김서준_백엔드_이력서_수정본.pdf', job: false }),
  'ext-nosave': ext({ saved: false }),
  'ext-ok': ext({ josa: '으로', gate: '내 서류에 저장했어요. 결과를 확인할까요?' }),
  'ext-fail': ext({ josa: '으로', saved: false, gate: '내 서류에 저장하지 못했어요. 결과를 확인할까요?' }),
  // Each phase board draws one thread under its own user line, so jump to it in a fresh conversation (Android types the alias).
  '1번, 지금 이력서로 할게요': ph0Input,
  'ph0-input': ph0Input,
  '이력서만 · 자료 3개 · 말투 그대로': ph0Start,
  'ph0-start': ph0Start,
  'feedback only': feedbackOnly,
  // ChatDoneProfile: the finished profile run without the 확인했어요 gate, so one elapsed line and no answer bubbles.
  'profile-done': [...profileCard('6.9 → 8.1', '로'), done],
  // Jumps for the boards that draw one phase under its own user line, without the earlier phases above it (Android types the alias).
  '네, 맞춰서 고쳐 주세요': ph2,
  ph2,
  '네, 써 주세요': ph3Writing,
  'ph3-write': ph3Writing,
  '클래식으로 만들기': [...ph5, ...finish('6.9 → 8.1', '으로')],
  ph5: [...ph5, ...finish('6.9 → 8.1', '으로')],
  '중간 제약으로': verifyFail,
  'verify-fail': verifyFail,
  // ChatPh6Result: the closing line and the card under the open gate, with no task lines, bullets or 작업했어요 footer.
  'profile-gate': [...profileDone(300, '6.9 → 8.1', '으로'), present],
  'ph1-free': ph1Plan('FREE'),
  'ph1-ultra': ph1Plan('ULTRA'),
  // The open gate hides the chat from accessibility, so hold it back until a tour has tapped the card open.
  'ph1-ultra-open': ph1Plan('ULTRA', DWELL + 4000),
  'auto-pick': autoPick,
  // The long-held working line: a second message or 중지 must land while it still runs (ChatWorking, ChatInterrupt on Android).
  // ChatHeaderNoCompany: no posting yet, so the conversation has no company and the header pill shows the logo only.
  'no-posting': noPosting,
  // ChatResume: the work that was running when the chat was left, asked about on the next message.
  'resume-doc': startDocument,
  // The company-bot boards (ChatBotStatus*): hold one status line (중지 on it is ChatBotStatusStopped), or stop at a card.
  'st-think': held('생각 중'),
  'st-work': held('공고 요건을 읽는 중'),
  'st-steps': statusSteps,
  'st-queue': held('순서를 기다리는 중 · 앞에 작업 1개'),
  'st-long': held('누리클라우드 플랫폼엔지니어링코리아 판교캠퍼스 유한회사 공고 3개의 필수 요건과 우대 요건을 서로 비교하는 중'),
  'st-help': statusHelp,
  'st-approve': statusApprove,
  // The stream mapper reads a notice frame at runtime (notices.ts), though the scripted frame type does not list one.
  'read-off': [s(300, { type: 'notice', text: READ_OFF_TEXT } as unknown as Frame), done],
  'tailor hold': [...tailorRead, ...tailorFit(TODO, -1, HOLD)],
  // ChatStates.4 in one conversation: the file card, then the apply record, then (busy below) the 혼잡 error.
  'states-file': statesFile,
  'states-apply': appliedRecord,
  // Jump straight to a phase: the design draws each phase under its own user line.
  analyze: ph1,
  boost: ph3Boost,
  // ChatPh3BoostStop, second state: the score stopped moving before the fifth round.
  'boost-stuck': [...ph3Boost.slice(0, -1), s(400, agent('더 올리기 어려워서 여기서 멈출게요.')), ...after(ph4Quality, BEFORE_QUALITY)],
  // ChatPh4Quality draws the quality check right under this line, without the boost card.
  quality: after(ph4Quality, QUALITY_LATER),
  '품질 검사로 넘어가기': after(ph4Quality, QUALITY_LATER),
  'ph2x': ph2xApproach,
  '네, 시작해 주세요': ph1,
  '피드백만 받을게요': feedbackOnly,
  '좋아요, 계속해 주세요': ph3Boost,
  '필요한 프로젝트 경험까지 만들어 주세요': ph2xApproach,
}

export const pick = (text: string, interrupted: boolean, attachment?: string, intent?: string, run?: string): { steps: Step[]; labels?: string[] } | null => {
  // The Android keyboard capitalizes the first letter of a tour's typed English alias.
  const t = text.trim().toLowerCase()
  // `run:<token>` (links.ts) plays that scenario for any text, so a tour can type the design's own user line (ChatErrUnavailable, ChatErrOther).
  const token = TOKENS[run ?? t]
  if (token) return { steps: token }
  // 서류 보기 › 봇으로 고치기 sends the file name as its attachment; that is the read-then-fix run below, not an external file.
  if (attachment && t !== '이 서류를 고쳐 줘') return { steps: fileRun() }
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
  if (t === '이 서류를 고쳐 줘') return { steps: fixDocRun, labels: TODO }
  if (/맞춰|고쳐|^tailor/.test(t)) return { steps: [...tailorRead, ...tailorFit(TODO)], labels: TODO }
  return { steps: generic(text) }
}
