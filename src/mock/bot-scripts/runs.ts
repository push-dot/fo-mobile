import type { StreamEvent } from '@push/api-client'
import { GATED_STEP } from '../../features/chat/constants'
import { STATUS_STEPS } from '../../features/chat/utils/status-line'
import type { Step } from '../../features/chat/types'
import { DRAFT_V1_MD } from './cards'
import { PROFILE_REVIEW_COUNTS, PROFILE_REVIEW_HUNKS } from './review-doc'
import { choiceSurface, confirmSurface, editSurface, pageReadSurface, profileSurface, surface, todoSurface } from './surfaces'

type Frame = Step['frame']
type Tool = Extract<StreamEvent, { type: 'tool' }>

const s = (wait: number, frame: Frame): Step => ({ wait, frame })
const status = (text: string): Frame => ({ type: 'status', text })
const agent = (text: string): Frame => ({ type: 'token', text })
const tool = (name: string, summary: string, target: string | undefined, state: Tool['state'], resultLine?: string, extra?: string[]): Tool => ({
  type: 'tool', name, summary, state, ...(target ? { target } : {}), ...(resultLine ? { resultLine } : {}), ...(extra ? { extra } : {}),
})
const todo = (id: string, labels: string[], done: number, added = -1): Frame => todoSurface(id, labels, done, added)
const ask = (card: Frame) => s(500, card)
const numbered = (id: string, title: string, labels: string[], selected = 0) => choiceSurface(id, title, labels, selected ? { recommended: selected } : {})
const done = s(200, { type: 'done', operation: null })
const awaitingDone = s(200, { type: 'done', operation: null, awaiting: 'approval' })
const awaitingChoiceDone = s(200, { type: 'done', operation: null, awaiting: 'choice' })
const DOC = 'd1'

export const RESUME = '김서준_백엔드_이력서_2026.pdf'
export const MOA = '모아페이 · 백엔드 엔지니어'
export const PROFILE_TODO = ['프로필 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', '프로필에 저장']
export const TODO = ['이력서 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', 'Push 프로필 만들기']
const FILE_TODO = TODO
const FILE_PAGE = 'A4 1쪽 · 186KB'
export const TODO_PLUS = ['이력서 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', '자기소개서 초안 쓰기', 'Push 프로필 만들기']
const DWELL = 8000
const REVIEW_HOLD = 60_000
const JD_RUN_HOLD = 20_000
const QUALITY_LATER = 15_000
const after = (steps: Step[], ms: number): Step[] => steps.map((st, i) => (i === 0 ? { ...st, wait: ms } : st))
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

const fixDocRun: Step[] = [
  s(200, status('서류를 읽는 중')),
  s(300, tool('resume', '이력서 읽기', RESUME, 'run', '서류를 읽는 중')),
  s(HOLD, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  done,
]

const tailorFit = (labels: string[], added = -1, hold = DWELL): Step[] => [
  s(200, todo('todo', labels, 2, added)),
  s(100, status(added < 0 ? '기술 스택을 비교하는 중' : '경력 수준을 비교하는 중')),
  s(200, tool('fit', '적합도 계산', added < 0 ? '5개 항목' : '이어서', 'run', added < 0 ? '기술 스택을 비교하는 중' : '경력 수준을 비교하는 중')),
  s(hold + 1300, tool('fit', '적합도 계산', '5개 항목', 'ok', '6.9점 · 키워드와 도메인이 약해요')),
  s(400, todo('todo', labels, 3, added)),
  s(500, agent('경력 섹션을 공고에 맞게 고쳤어요. 적합도는 6.9 → 8.1로 올라요.')),
  s(300, status('끄적이는 중…')),
  s(1200, tool('edit', '이력서 수정', '경력 · 모아페이', 'wait', `${PROFILE_REVIEW_COUNTS.added}줄 추가, ${PROFILE_REVIEW_COUNTS.removed}줄 삭제`)),
  ask(editSurface('tailor-apply', PROFILE_REVIEW_HUNKS.map(({ sign, text }) => ({ sign, text })), DOC, `${PROFILE_REVIEW_COUNTS.added}줄을 더하고 ${PROFILE_REVIEW_COUNTS.removed}줄을 뺐어요`)),
]

const TASK_RESULT = '반영했어요 · 2줄 추가, 1줄 삭제'
export const PROFILE_NAME = '김서준 · 백엔드 엔지니어'
const profileDone = (wait: number, score: string): Step[] => [s(wait + 200, profileSurface(`result-profile-${score}`, PROFILE_NAME, 'd1'))]
const profileCard = (score: string): Step[] => [
  s(400, tool('task', '프로필 수정', 'Push 프로필 · 경력', 'ok', TASK_RESULT)),
  s(200, todo('todo', PROFILE_TODO, PROFILE_TODO.length)),
  ...profileDone(200, score),
]
const finish = (score: string): Step[] => [...profileCard(score), done]

const EXT_FILE = '김서준_모아페이_백엔드.pdf'
const ext = (o: { todo?: string[]; fileName?: string; saved?: boolean; bare?: boolean }): Step[] => {
  const labels = o.todo ?? FILE_TODO
  const saved = o.saved ?? true
  return [
    ...(o.bare
      ? []
      : [
          s(200, tool('task', '이력서 수정', '올린 파일 · 경력', 'ok', TASK_RESULT)),
          s(200, tool('pdf', 'PDF 만들기', '모던 템플릿', 'ok', FILE_PAGE)),
          s(200, todo('todo', labels, labels.length)),
        ]),
    s(500, surface(saved ? 'result' : 'result-save-failed', `result-${o.fileName ?? EXT_FILE}-${saved ? 'saved' : 'failed'}`)),
    done,
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
  s(1500, { ...tool('jd', '공고 읽기', '회사 채용 페이지', 'err'), result: { error: '“자격 요건”은 로그인이 필요한 영역이라 읽지 못했어요.' } }),
  s(400, agent('나머지 내용으로 진행할 수 있지만, 자격 요건이 빠지면 적합도가 정확하지 않을 수 있어요.')),
  ask(numbered('fail-choice', '어떻게 할까요?', ['공고 내용을 붙여넣을게요', '이대로 진행해 주세요', 'Push 공고에서 고를게요'])),
]

const say = (text: string): Step[] => [s(600, agent(text)), done]

const ph0: Step[] = [
  s(300, status('생각하는 중…')),
  s(600, agent('좋아요! 시작하기 전에 하나만 여쭤볼게요.')),
  ask(numbered('ph0', '어떤 방식으로 진행할까요?', ['이력서부터 쓰기', '경험부터 정리하기', '그만하기'])),
]
const ph0Input: Step[] = [
  s(500, agent('Push에 있는 자료부터 찾아볼게요.')),
  s(300, tool('find', '자료 찾기', '마이 › 서류 · 북마크 공고', 'run', '서류와 북마크를 훑는 중')),
  s(1200, tool('find', '자료 찾기', '마이 › 서류 · 북마크 공고', 'ok', '이력서 3개 · 북마크 공고 2개 · GitHub 링크 1개')),
  ask(surface('choice-sections', 'ph0-input')),
]
const ph0Start: Step[] = [
  s(400, tool('input', '입력 정리', undefined, 'ok', `이력서 **${RESUME}**\n공고 **${MOA}**\nGitHub **github.com/seojun-kim** · 말투 **그대로**`)),
  ask(numbered('ph0-start', '이대로 분석을 시작할까요?', ['시작하기', '자료 바꾸기', '그만할게요'])),
]
const ph1Fit = (plan: 'FREE' | 'PRO' | 'ULTRA', gateWait = 500): Step[] => [
  s(300, surface(plan === 'FREE' ? 'fit-locked' : 'fit', `fit-${plan}`)),
  { ...ask(numbered('ph1-fit', '이 공고에 맞춰 이력서를 고칠까요?', ['고치기', '피드백만 받기', '점수만 보기'])), wait: gateWait },
]
const ph1Plan = (plan: 'FREE' | 'ULTRA', gateWait?: number): Step[] => [
  s(200, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'ok', '6.9점')),
  ...ph1Fit(plan, gateWait),
  awaitingChoiceDone,
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
  s(200, status('필수·우대 스택을 뽑는 중')),
  s(100, tool('jd', '공고 읽기', MOA, 'run', '필수·우대 스택을 뽑는 중')),
  s(JD_RUN_HOLD, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개', JD_LINES)),
  s(200, todo('todo1', PH1, 3)),
  s(200, status('맞춰보는 중…')),
  s(200, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'run', '항목별 점수를 내는 중')),
  s(1500, tool('fit', '적합도 계산', '5개 항목 · 가중치 반영', 'ok', '6.9점')),
  s(200, todo('todo1', PH1, 4)),
  ...ph1Fit('PRO'),
  awaitingChoiceDone,
]
const feedbackOnly: Step[] = [
  s(300, tool('fbt', '피드백 정리', '공고 요건 ↔ 내 이력서', 'ok', '고칠 점 3개')),
  s(400, agent('이 공고 기준으로 고칠 점이에요.')),
  s(300, surface('plan-feedback', 'plan:feedback')),
  ask(numbered('feedback', '피드백을 반영해서 수정할까요?', ['수정하기', '그대로 둘게요', '그만하기'])),
]
export const startDocument: Step[] = [
  s(400, agent('작성 중인 이력서 초안(v1)이 있어요.')),
  s(100, agent(`\n${DRAFT_V1_MD}`)),
  ask(numbered('start-document', '이어서 작성할까요?', ['이어서 작성하기', '새로 시작하기'])),
]
const ph2: Step[] = [
  s(200, status('궁리하는 중…')),
  s(200, tool('strategy', '전략 세우기', '공고 요건 ↔ 내 경력', 'run', '섹션마다 할 일을 정하는 중')),
  s(1500, tool('strategy', '전략 세우기', '공고 요건 ↔ 내 경력', 'ok', '섹션 5개 · 추가할 키워드 4개')),
  s(300, agent('이렇게 고칠게요.')),
  s(300, surface('plan-strategy', 'plan:strategy')),
  ask(numbered('ph2', '이 전략대로 초안을 쓸까요?', ['초안 쓰기', '피드백만 보기', '그만하기'])),
]
const PH3 = ['요약', '경력', '프로젝트', '기술 스택', '학력']
const ph3Open: Step[] = [
  s(200, status('끄적이는 중…')),
  s(200, todo('todo3', PH3, 1)),
  s(100, status('경력 섹션을 쓰는 중')),
  s(100, tool('draft', '초안 쓰기', '이력서 v1 · 경력', 'run', '경력 섹션을 쓰는 중')),
]
const paper = s(300, surface('paper', 'paper:draft'))
const DRAFT_REVIEW_MD = [
  '첫 번째 초안(v1)을 만들었어요.',
  '• 승인 API 성과를 숫자로 강조했어요',
  '• 프로젝트 payment-retry-lab을 넣었어요',
  '• Kafka를 기술 스택 맨 앞으로 옮겼어요',
  '• 사내 동아리 활동은 줄였어요',
  `[이력서 초안 v1](/docs/push/${DOC}) · 미리보기`,
].join('\n')
const ph3Rest = (wait: number): Step[] => [
  s(wait, todo('todo3', PH3, 3)),
  s(1200, todo('todo3', PH3, 5)),
  s(300, tool('draft', '초안 쓰기', '이력서 v1', 'ok', '1쪽 · 섹션 5개 · 말투 그대로')),
  s(300, agent(DRAFT_REVIEW_MD)),
  s(300, status('초안을 검토하는 중')),
]
const ph3Boost: Step[] = [
  s(200, status('점수 올리는 중…')),
  s(200, tool('boost1', '점수 올리기 1회', '키워드', 'run', '키워드를 넣는 중')),
  s(1300, tool('boost1', '점수 올리기 1회', '키워드', 'ok', '6.9 → 7.5 · 정산 배치, 장애 대응을 경력 문장에 넣었어요')),
  s(200, tool('boost2', '점수 올리기 2회', '경력 · 모아페이', 'run', '성과를 숫자로 쓰는 중')),
  s(1300, tool('boost2', '점수 올리기 2회', '경력 · 모아페이', 'ok', '7.5 → 8.0 · 승인 API 성과를 숫자로 보여 줬어요')),
  s(200, tool('boost3', '점수 올리기 3회', '도메인', 'run', '도메인 맥락을 다시 쓰는 중')),
  s(1300, tool('boost3', '점수 올리기 3회', '도메인', 'ok', '8.0 → 8.3 · payment-retry-lab을 정산 맥락으로 고쳤어요')),
  s(300, surface('fit-boost', 'fit-boost')),
  ask(numbered('ph3-boost', '점수를 한 번 더 올릴까요?', ['한 번 더 올리기', '여기서 멈추기', '그만하기'])),
]
const ph3: Step[] = [...ph3Open, ...ph3Rest(DWELL), s(REVIEW_HOLD, status('초안을 검토하는 중')), ...ph3Boost]
const ph3Writing: Step[] = [...ph3Open, paper, ...ph3Rest(HOLD), ...ph3Boost]
const QUALITY_HOLD = 10_000
const DESIGN_ASK = ask(surface('choice-templates', 'ph4-design'))
const ph4Design: Step[] = [
  s(QUALITY_HOLD, agent('템플릿을 골라 주세요. 처음이라면 클래식을 추천해요.')),
  s(100, tool('design', '디자인 고르기', undefined, 'ok')),
  s(200, agent('검증을 마쳤어요. 디자인을 골라 주세요.')),
  DESIGN_ASK,
]
const QUALITY_MD = [
  '품질 검사를 마치고 추천 수정까지 반영했어요.',
  '• 오타: 트랜젝션 → 트랜잭션',
  '• 날짜: 2022.04 → 2022.03',
  '• 가운데점(·) 나열을 쉼표로',
  '• 경력 본문의 현재형 문장 2곳',
  '• 말투를 “~했습니다”로 통일',
].join('\n')
const ph4Check: Step[] = [
  s(200, status('검사하는 중…')),
  s(300, tool('qa', '품질 검사', '오타 · 문법 · 말투 · ATS', 'run', '문장을 하나씩 보는 중')),
  s(1200, tool('qa', '품질 검사', '오타 · 문법 · 말투 · ATS', 'ok', '바로 고친 것 2개 · 추천 3개')),
  s(300, agent(QUALITY_MD)),
  s(200, tool('qa', '품질 검사', '오타 · 문법 · 말투 · ATS', 'ok', '추천 수정 3곳도 반영했어요')),
  s(300, agent('이제 디자인을 고를게요.')),
]
const ph4Quality: Step[] = [...ph4Check, ...ph4Design]
const ph5: Step[] = [
  s(200, status('정리하는 중…')),
  s(300, tool('design', '디자인 적용', '모던', 'ok', 'A4 1쪽 · 여백과 줄 간격 맞춤')),
  s(300, tool('photo', '프로필 사진', '마이 › 프로필', 'ok', '헤더 왼쪽 원형 80px')),
  s(300, tool('save', 'Push 프로필', '마이 › 프로필', 'run', 'Push 프로필에 저장하는 중…')),
  s(200, status('Push 프로필에 저장하는 중…')),
  s(HOLD, tool('save', 'Push 프로필', '마이 › 프로필', 'ok', '저장했어요')),
]
const ph2xApproach: Step[] = [
  s(200, status('공고 뜯어보는 중…')),
  s(300, tool('jd', '공고 분석', MOA, 'run', '필수 스택을 뽑는 중')),
  s(1300, tool('jd', '공고 분석', MOA, 'ok', '필수 스택 5개 · 서비스 도메인: 결제·정산')),
  s(400, agent('공고에 필요한 경험을 만들 방향을 골라 주세요.')),
  ask(numbered('ph2x-approach', '어떤 방식으로 경험을 만들까요?', ['병목 만들기', '문제 예방하기', '그만하기'])),
]
const ph2xLevel: Step[] = [
  ask(numbered('ph2x-level', '병목 강도를 어느 정도로 할까요?', ['가벼운 제약', '중간 제약', '강한 제약', '그만하기'], 1)),
]
const noPosting: Step[] = [
  s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')),
  ...say('어떤 공고에 지원하실 건가요? 공고 링크를 보내 주시면 그 회사에 맞춰 고칠게요. 공고 없이 다듬기만 해도 돼요.'),
]
const PREVENT = ['성능', '보안', '확장성', '안정성', '유지보수', '데이터 무결성', '그만하기']
const ph2xPrevent: Step[] = [
  ask(choiceSurface('ph2x-prevent', '어떤 문제를 예방할까요?', PREVENT, { multiple: true })),
]
const ph2xBlueprints: Step[] = [
  s(200, status('기획하는 중…')),
  s(300, tool('check', '방향 검증', '5개 기준', 'run', '공고 연관성을 보는 중')),
  s(1200, tool('check', '방향 검증', '5개 기준', 'ok', '공고 연관성·임팩트·실현 가능성 모두 통과')),
  s(300, agent('프로젝트 기획서 4개를 만들었어요.')),
  s(300, surface('plan-strategy', 'plan:blueprints')),
  ask(choiceSurface('ph2x-bp', '어떤 프로젝트를 구현할까요?', ['결제 승인 재시도 큐', '정산 배치 병렬화', '결제 이벤트 아웃박스', '가맹점 API 레이트 리미터', '그만하기'], { submit: '구현하기' })),
]

const applyRun: Step[] = [
  s(200, status('지원 준비하는 중…')),
  s(300, tool('save', '내 서류에 저장', undefined, 'run', '저장하는 중')),
  s(900, tool('save', '내 서류에 저장', undefined, 'ok')),
  s(300, tool('apply', '지원하기', MOA, 'wait', '확인을 기다리는 중')),
  ask(confirmSurface('apply', `${MOA} (Kotlin·Spring)에 지원할까요?`, ['지원하기', '닫기'])),
]

export const generic = (text: string): Step[] => [
  s(200, status('정리하는 중…')),
  s(700, agent('알겠어요. 필요한 자료부터 살펴볼게요.')),
  s(300, tool('req', '요청 정리', text.length > 24 ? `${text.slice(0, 24)}…` : text, 'run', '할 일을 나누는 중')),
  s(1500, tool('req', '요청 정리', text.length > 24 ? `${text.slice(0, 24)}…` : text, 'ok', '할 일 3개로 나눴어요')),
  ...say('정리했어요. 더 필요한 게 있으면 말해 주세요.'),
]

export const PROFILE_CHANGE_ASK = 'change headline'
export const PROFILE_CHANGE_HEADLINE = '결제·정산 시스템을 만드는 시니어 백엔드 개발자'
export const PROFILE_CHANGE_REPLY = '한 줄 소개를 바꿨어요.'
export const profileChangeRun = (changeId: string): Step[] => [
  s(200, status('프로필을 고치는 중')),
  s(400, { ...tool('update_my_profile', '프로필 수정', undefined, 'ok'), result: { headline: PROFILE_CHANGE_HEADLINE, changeId } }),
  ...say(PROFILE_CHANGE_REPLY),
]

export const next: Record<string, (choice: number, labels: string[]) => Step[]> = {
  'tailor-apply': (c, l) => (c === 1 ? tailorDone(l) : [s(200, tool('edit', '이력서 수정', '경력 · 모아페이', 'ok', '그대로 뒀어요')), ...say('이 수정은 적용하지 않았어요.')]),
  'fail-choice': (c) =>
    c === 0 ? say('공고 본문을 붙여넣어 주세요. 받는 대로 이어서 할게요.')
      : c === 1 ? tailorFit(TODO)
        : say('북마크한 공고 중에서 골라 주세요. @언급으로 불러올 수 있어요.'),
  ph0: (c) => (c === 0 ? ph0Input : c === 1 ? ph2xApproach : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph0-input': () => ph0Start,
  'ph0-start': (c) => (c === 0 ? ph1 : c === 1 ? ph0Input : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph1-fit': (c) => (c === 0 ? ph2 : c === 1 ? feedbackOnly : say('적합도는 6.9점이에요. 필요하면 언제든 고쳐 드릴게요.')),
  feedback: (c) => (c === 0 ? ph2 : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'start-document': (c) => (c === 0 ? say('멈춘 곳부터 이어서 할게요.') : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  ph2: (c) => (c === 0 ? ph3 : c === 1 ? say('피드백만 정리해 드릴게요. 초안은 쓰지 않았어요.') : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph3-boost': (c) =>
    c === 0
      ? [s(400, agent('최대 5번까지 올렸어요.')), done]
      : c === 1
        ? ph4Quality
        : say('알겠어요. 필요할 때 다시 불러 주세요.'),
  'ph4-design': (c) => (c === -1 ? say('알겠어요. 필요할 때 다시 불러 주세요.') : [...ph5, ...finish('6.9 → 8.1')]),
  'ph2x-verify': (c) => (c === 0 ? ph2xBlueprints : c === 1 ? ph2xApproach : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph2x-approach': (c) => (c === 0 ? ph2xLevel : c === 1 ? ph2xPrevent : say('알겠어요. 필요할 때 다시 불러 주세요.')),
  'ph2x-level': (c) => (c === 3 ? say('알겠어요. 필요할 때 다시 불러 주세요.') : ph2xBlueprints),
  'ph2x-prevent': (c) => (c === 6 ? say('알겠어요. 필요할 때 다시 불러 주세요.') : ph2xBlueprints),
  'ph2x-bp': (c) => (c === 4 ? say('알겠어요. 필요할 때 다시 불러 주세요.') : say('좋아요. 고른 프로젝트로 이어갈게요.')),
  apply: (c) =>
    c === 0
      ? [s(300, tool('apply', '지원하기', MOA, 'ok', '지원했어요')), ...say('지원했어요. 내 활동에서 진행 상황을 볼 수 있어요.')]
      : [s(300, tool('apply', '지원하기', MOA, 'ok', '지원하지 않았어요')), ...say('천천히 보고 말해 주세요.')],
}

export const verifyFail: Step[] = [
  s(200, status('검증하는 중…')),
  s(300, tool('check', '방향 검증', '5개 기준', 'run', '공고 연관성을 보는 중')),
  s(1200, tool('check', '방향 검증', '5개 기준', 'err')),
  s(200, { type: 'notice', text: '방향 검증을 통과하지 못했어요.' } as unknown as Frame),
  ask(numbered('ph2x-verify', '어떻게 할까요?', ['다시 시도', '방향 바꾸기', '그만하기'])),
]
const autoPick: Step[] = [
  s(300, tool('jd', '공고 읽기', MOA, 'ok', '필수 5개 · 우대 3개')),
  s(400, agent('모던 템플릿으로 만들고, 경력 섹션부터 고칠게요.')),
  s(300, status('경력 섹션을 쓰는 중')),
  s(DWELL + 12000, tool('pdf', 'PDF 만들기', '모던 템플릿', 'ok', FILE_PAGE)),
  done,
]
const statesFile: Step[] = [s(500, surface('result', 'result-states')), done]
const appliedRecord: Step[] = [
  s(300, tool('apply', '지원하기', MOA, 'run', EXT_FILE)),
  s(900, tool('apply', '지원하기', MOA, 'ok')),
  s(300, agent('모아페이에 지원했어요.\n[이동하기](/my)')),
  done,
]
const awaitReply: Step[] = [
  s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건')),
  s(400, agent('경력 섹션을 이렇게 바꿀게요. 승인 API 성과를 숫자로 보여 주고, Kafka 경험을 맨 앞으로 옮겨요.')),
  done,
]
export const fail = (code: string, details?: Record<string, unknown>): Step[] => [s(300, { type: 'error', error: { code, message: code, ...(details ? { details } : {}) } })]

const held = (text: string): Step[] => [s(200, status(text)), s(HOLD, { type: 'done', operation: null })]
const statusSteps: Step[] = [...STATUS_STEPS.map((text, i) => s(i ? GATED_STEP : 200, status(text))), s(GATED_STEP, { type: 'done', operation: null })]
const statusHelp: Step[] = [
  ask(numbered('st-help', '지원 동기 첫 문장', ['제품 관점', '데이터 관점', '직접 입력할게요'])),
  awaitingDone,
]
const statusApprove: Step[] = [ask(pageReadSurface('st-approve', '채용 페이지 열기', 'careers.moapay.co.kr를 열어도 될까요?')), awaitingDone]

const TOKENS: Record<string, Step[]> = {
  'err-unavailable': fail('NOT_CONFIGURED'),
  'err-disconnect': fail('DISCONNECTED', { reason: '연결이 끊겼어요' }),
  'err-credit': fail('INSUFFICIENT_CREDITS'),
  'err-other': [s(300, agent('좋아요. 공고와 이력서를 비교해서 맞춤 초안을 만들어 볼게요.')), s(300, tool('resume', '이력서 읽기', RESUME, 'ok', '2쪽 · 경력 2건, 프로젝트 5건, 링크 3개')), ...fail('UNKNOWN')],
  'ext-done': ext({}),
  'ext-nojob': ext({ todo: ['이력서 읽기', '고칠 점 찾기', '경력 섹션 고치기', 'Push 프로필 만들기'], fileName: '김서준_백엔드_이력서_수정본.pdf' }),
  'ext-nosave': ext({ saved: false }),
  'ext-ok': ext({ bare: true }),
  'ext-fail': ext({ saved: false, bare: true }),
  '1번, 지금 이력서로 할게요': ph0Input,
  'ph0-input': ph0Input,
  '이력서 · 자료 2개 · 말투 그대로': ph0Start,
  'ph0-start': ph0Start,
  'feedback only': feedbackOnly,
  'profile-done': [...profileCard('6.9 → 8.1'), done],
  '네, 맞춰서 고쳐 주세요': ph2,
  ph2,
  '네, 써 주세요': ph3Writing,
  'ph3-write': ph3Writing,
  '클래식으로 만들기': [...ph5, ...finish('6.9 → 8.1')],
  ph5: [...ph5, ...finish('6.9 → 8.1')],
  '중간 제약으로': verifyFail,
  'verify-fail': verifyFail,
  'ph2x-blueprints': ph2xBlueprints,
  '기획서 보여 줘': ph2xBlueprints,
  'profile-result': [...profileDone(300, '6.9 → 8.1'), done],
  'ph1-free': ph1Plan('FREE'),
  'ph1-ultra': ph1Plan('ULTRA'),
  'ph1-ultra-open': ph1Plan('ULTRA', DWELL + 4000),
  'auto-pick': autoPick,
  'no-posting': noPosting,
  'resume-doc': startDocument,
  'st-think': held('생각 중'),
  'st-work': held('공고 요건을 읽는 중'),
  'st-steps': statusSteps,
  'st-queue': held('순서를 기다리는 중 · 앞에 작업 1개'),
  'st-long': held('공고 읽는 중'),
  'st-help': statusHelp,
  'st-approve': statusApprove,
  'tailor hold': [...tailorRead, ...tailorFit(TODO, -1, HOLD)],
  'states-file': statesFile,
  'states-apply': appliedRecord,
  analyze: ph1,
  boost: ph3Boost,
  'boost-stuck': [...ph3Boost.slice(0, -1), s(400, agent('더 올리기 어려워서 여기서 멈출게요.')), done],
  'boost-max': [...ph3Boost.slice(0, -1), s(400, agent('최대 5번까지 올렸어요.')), done],
  quality: after([...ph4Check, done], QUALITY_LATER),
  '품질 검사로 넘어가기': after([...ph4Check, done], QUALITY_LATER),
  design: ph4Design,
  '2개 반영하고 디자인으로': ph4Design,
  'flow-history': [s(200, todo('todo', TODO, TODO.length)), done],
  'ph2x': ph2xApproach,
  '네, 시작해 주세요': ph1,
  '피드백만 받을게요': feedbackOnly,
  '좋아요, 계속해 주세요': ph3Boost,
  '필요한 프로젝트 경험까지 만들어 주세요': ph2xApproach,
}

const deadlineRun: Step[] = [
  s(200, status('북마크 마감일 보는 중')),
  s(900, agent('이번 주 안에 마감되는 북마크가 4개예요.\n• 파도AI · 데이터 분석가 · D-2 · 서류가 없어요\n• 도토리증권 · 서버 개발자 (Go) · D-4 · 서류가 준비됐어요\n• 그린티켓 · 그로스 마케터 · D-6 · 서류가 없어요\n• 새벽마켓 · ML 엔지니어 · D-7 · 초안이 있어요')),
  s(300, agent('\n\n준비할 일이에요.\n1. 파도AI는 이틀 남았으니 오늘 서류부터 만들어요.\n2. 도토리증권은 준비한 서류로 지원만 하면 돼요.\n3. 그린티켓은 서류를 만들고 새벽마켓은 초안을 마무리해요.')),
  done,
]

export const pick = (text: string, interrupted: boolean, attachment?: string, intent?: string, run?: string): { steps: Step[]; labels?: string[] } | null => {
  const t = text.trim().toLowerCase()
  const token = TOKENS[run ?? t]
  if (token) return { steps: token }
  if (attachment && t !== '이 서류를 고쳐 줘') return { steps: fileRun() }
  if (intent === 'fit') return { steps: ph1 }
  if (intent === 'deadline_postings') return { steps: deadlineRun }
  if (intent === 'boost') return { steps: ph3Boost }
  if (intent === 'experience') return { steps: ph2xApproach }
  if (/지원해|^apply$/.test(t)) return { steps: applyRun }
  if (/저장해/.test(t)) return { steps: [s(300, tool('save', '내 서류에 저장', undefined, 'ok', '저장했어요 · 마이 › 서류')), done] }
  if (/실패|채용 페이지|^fail$/.test(t)) return { steps: failRun, labels: TODO }
  if (/만들어 주세요|^make resume$/.test(t)) return { steps: ph0 }
  if (/push 프로필 만들어 줘/.test(t)) return { steps: autoPick }
  if (/경력 섹션을 공고에 맞게/.test(t)) return { steps: awaitReply }
  if (interrupted) return null
  if (t === '이 서류를 고쳐 줘') return { steps: fixDocRun, labels: TODO }
  if (/맞춰|고쳐|^tailor/.test(t)) return { steps: [...tailorRead, ...tailorFit(TODO)], labels: TODO }
  return { steps: generic(text) }
}
