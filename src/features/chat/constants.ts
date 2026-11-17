import type { AccessMode, ChatIntent } from '@push/api-client'
import type { Icon3DName } from '@/shared/components'
import type { QsItem } from './api/schemas'
import { ERROR_TEXT } from './error-text'

export { ERROR_TEXT } from './error-text'

// Motion values from feature-spec 15.4. Reduce Motion → fades only, no loops.
export const BUBBLE = [0.2, 0.9, 0.25, 1.15] as const

export const DEFAULT_ACCESS_MODE: AccessMode = 'AUTO'

export const MICRO_CREDITS_PER_CREDIT = 6000

export const CHOICE_QUESTION = '어떻게 할까요?'
export const MULTI_PICK_SUBMIT = '이대로 진행'
export const HINTLESS_GATES = ['validate_cap']

/** The in-progress phrase while the cancel request is out (ChatBotStatusStopped, rule 29: a status is the step under way, the result is a bubble). */
export const STOPPING_TEXT = '중지하는 중'

export const AWAITING_TEXT = { approval: '확인을 기다리고 있어요', choice: '답을 기다리고 있어요' } as const
export const FIT_ROWS = [
  { key: 'techStack', label: '기술 스택' },
  { key: 'experienceLink', label: '경험 연관성' },
  { key: 'careerLevel', label: '경력 수준' },
  { key: 'keyword', label: '키워드' },
  { key: 'domain', label: '도메인' },
] as const
/** The FREE lock under the fit sentence (ChatPh1FitFree). */
export const FIT_LOCKED = '항목별 점수는 PRO에서 볼 수 있어요 ›'

export const queueBusyText = (sec: number) => `지금 요청이 많아요. ${sec}초 뒤에 다시 보내 주세요.`
// push-be writes nothing while a Stripe webhook holds the billing row, so the same request can go again. Same line as fo-web streamErrorText.
export const billingLockedText = (sec: number) => `결제 정보를 정리하고 있어요. ${sec}초 뒤에 다시 보내 주세요.`
/** QUEUE_BUSY copy. reason BILLING_LOCKED uses the web billing line when a retry delay is known. */
export const queueBusyMessage = (retryAfterSec?: number, reason?: unknown) => {
  if (retryAfterSec && reason === 'BILLING_LOCKED') return billingLockedText(retryAfterSec)
  if (retryAfterSec) return queueBusyText(retryAfterSec)
  return ERROR_TEXT.QUEUE_BUSY
}
/** The tail of the status line when the stream drops and cannot be picked up again. */
export const DISCONNECT_REASON = '연결이 끊겼어요'
export const DEFAULT_ERROR_TEXT = '작업을 이어가지 못했어요. 다시 보내 주세요.'
/** A scripted mock step with this wait does not run on a timer: it waits for the mock link `step-next` (ChatBotStatusSteps). */
export const GATED_STEP = -1

/** The error line of a failed attachment upload carries this code: no run started, so the header lamp stays off (ChatErrUpload). */
export const UPLOAD_ERROR_CODE = 'UPLOAD_FAILED'
export const UPLOAD_ERROR_TEXT = '파일을 올리지 못했어요. 네트워크를 확인하고 다시 올려 주세요.'
export const CHAT_STOP_FORBIDDEN = '다른 담당자가 시작한 작업이라 멈출 수 없어요'
export const CHAT_STOP_FAILED = '멈추지 못했어요. 한 번 더 눌러 주세요'

export const THREAD_INITIAL_RENDER = 10
export const THREAD_BATCH = 8
export const THREAD_WINDOW = 2
export const THREAD_MOUNT_CAP = THREAD_INITIAL_RENDER + THREAD_BATCH * THREAD_WINDOW

export const CONSENT_TITLE = 'Bot을 쓰려면 동의가 필요해요'
export const CONSENT_BODY = '내 서류를 다른 Bot이 참고 자료로 써요.'
export const PLAN_HEADER = '플랜마다\n쓸 수 있는 양이 달라요'
export const ACCOUNT_REFERENCE_TITLE = 'Bot이 참고하는 내 정보'
export const ACCOUNT_REFERENCE_NOTE = '대화를 시작할 때 Bot이 이 정보부터 읽어요.'
export const docAiSub = (ago: string) => `Bot으로 만듦 · ${ago}`
export const linkMentionSub = (kindLabel: string, url: string) => `${kindLabel} · ${url.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
export const linkDeleteBody = (title: string) => `${title} 링크를 내 링크에서 지워요.`
export const LINK_EMPTY = '아직 모아 둔 링크가 없어요.'
export const LINK_ADD_NOTE = '추가하면 Bot이 README와 커밋을 읽어 둬요'
export const LINK_DELETED_TOAST = '링크를 삭제했어요'
export const FILE_SHARE_FAILED = '파일을 공유하지 못했어요. 잠시 뒤에 다시 해 주세요.'
export const FILE_SHARE_NOT_FINALIZED = '아직 마무리되지 않은 서류라 공유할 수 없어요.'
export const LINK_UNDO = '되돌리기'
export const PROFILE_SAVED = '프로필을 고쳤어요.'
export const BOOKMARK_EMPTY = '북마크한 공고가 없어요.'
export const CONSENT_AGREE = '동의하고 시작하기'
/** The default document of every quick start and of the account sheet is the default hub profile (RULINGS 31), never an uploaded file. */
export const DEFAULT_DOC = '허브 프로필'
const eulReul = (name = '') => `${name}${/[가-힣]$/.test(name) && (name.charCodeAt(name.length - 1) - 0xac00) % 28 !== 0 ? '을' : '를'}`
// Chat docs are the same rows as my sources, so the key sits under ['me', 'sources'] and refreshes when my uploads or removes one.
export const CHAT_DOCS_KEY = ['me', 'sources', 'chat-docs'] as const

export const CHAT_ATTACHMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]
export const CHAT_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
export const CHAT_ATTACHMENT_OPTIONS = { type: CHAT_ATTACHMENT_TYPES, copyToCacheDirectory: true }
// Android's document picker has no MIME for .md and greys it out, so it also lists any text and untyped file; `isChatAttachment` then filters by extension.
export const CHAT_ATTACHMENT_OPTIONS_ANDROID = { type: [...CHAT_ATTACHMENT_TYPES, 'text/*', 'application/octet-stream'], copyToCacheDirectory: true }
export const isChatAttachment = (name: string) => /\.(pdf|docx|txt|md)$/i.test(name)
export const CHAT_DOC_OPTIONS = { type: CHAT_DOC_TYPES, copyToCacheDirectory: true }

export type QsLayout = 'link' | 'match' | 'pick' | 'status' | 'calendar' | 'cards' | 'reply'

/** What the sheet collected; `start` turns it into the conversation title and first message. */
export type QsInput = { picked: QsItem[]; url: string; chips: string[]; option: boolean; doc?: string; documentId?: string; task: string; custom: string }

export type QuickStart = {
  key: string
  label: string
  icon: Icon3DName
  title: string
  /** Under the title; empty draws nothing (QsMatch). */
  description: string
  layout: QsLayout
  /** Button label; omitted when tapping a row starts the conversation (제안 답장). */
  action?: string | ((n: number) => string)
  multi?: boolean
  grid?: boolean
  docLabel?: string
  readsHub?: boolean
  listLabel?: string
  custom?: string
  instant?: boolean
  start: (i: QsInput) => { title: string; message: string; intent: ChatIntent; context?: { documentId: string } } | null | undefined
}

const opened = (title: string, message: string, intent: ChatIntent, documentId?: string) => ({
  title,
  message,
  intent,
  ...(documentId ? { context: { documentId } } : {}),
})

const one = (i: QsInput) => i.picked[0]
const host = (url: string) => url.replace(/^https?:\/\//, '').split(/[/?#]/)[0] ?? url

// Order of the previous design's quick-start row (Push 앱 › 이전 버전): the job tasks first, the calendar after the application status, social tasks last.
export const QUICK_STARTS: QuickStart[] = [
  {
    key: 'link', label: '공고 링크로 맞추기', icon: 'qs-job-link', layout: 'link', action: '맞추기 시작', readsHub: true,
    title: '어떤 공고에 맞출까요?', description: '링크를 붙여넣으면 서류를 맞춰 고쳐요.',
    start: (i) => (/^https?:\/\/\S+\.\S+/.test(i.url.trim()) ? opened(`${host(i.url)} 공고 맞춤`, `${i.url.trim()} 공고에 맞춰 ${eulReul(i.doc)} 고쳐 주세요`, 'match_posting', i.documentId) : null),
  },
  {
    key: 'match', label: '나에게 맞는 공고 찾기', icon: 'qs-match', layout: 'match', action: '공고 찾기',
    title: '이 조건으로 찾아볼까요?', description: '',
    start: (i) => i.chips.length ? opened('나에게 맞는 공고', `${i.chips.join(' · ')} 조건으로 공고를 찾아 주세요${i.option ? '. 적합도 7점 이상인 공고만 보여 주세요' : ''}`, 'find_postings', i.documentId) : null,
  },
  {
    key: 'gap', label: '부족한 점 찾기', icon: 'qs-gap', layout: 'pick', action: '부족한 점 찾기', listLabel: '공고', readsHub: true,
    title: '어떤 공고와 비교할까요?', description: '공고 요건과 내 서류를 비교해요.',
    start: (i) => one(i) && opened(`${one(i)!.over} 부족한 점`, `${one(i)!.over} ${one(i)!.title} 공고와 내 프로필을 비교해서 적합도와 부족한 점을 알려 주세요`, 'fit', i.documentId),
  },
  {
    key: 'fit', label: '적합도 보기', icon: 'qs-fit', layout: 'pick', action: '적합도 보기', listLabel: '공고', readsHub: true,
    title: '어떤 공고로 볼까요?', description: '점수가 오르도록 서류를 고쳐 드려요.',
    start: (i) => one(i) && opened(`${one(i)!.over} 적합도`, `${one(i)!.over} ${one(i)!.title} 공고와 내 프로필을 비교해서 적합도와 부족한 점을 알려 주세요`, 'fit', i.documentId),
  },
  {
    key: 'boost', label: '점수 올리기', icon: 'qs-boost', layout: 'pick', action: '점수 올리기 시작', docLabel: '올릴 서류', listLabel: '공고',
    title: '어떤 서류의 점수를 올릴까요?', description: '공고에 맞춰 최대 5번까지 고쳐요.',
    start: (i) => {
      const job = one(i)
      return job && i.doc ? opened(`${job.over} 점수 올리기`, `${job.over} ${job.title} 공고에 맞춰 ${i.doc} 점수를 올려 주세요`, 'boost', i.documentId) : null
    },
  },
  {
    key: 'deadline', label: '마감 임박 공고 정리', icon: 'qs-deadline', layout: 'pick', instant: true,
    title: '마감 임박 공고 정리', description: '',
    start: () => opened('마감 임박 공고 정리', '북마크한 공고 중 일주일 안에 마감되는 공고와 준비할 일을 알려 주세요', 'deadline_postings'),
  },
  {
    key: 'status', label: '지원 현황 정리', icon: 'qs-status', layout: 'status', multi: true, action: (n) => `${n}개 정리하기`,
    title: '어떤 지원을 정리할까요?', description: '단계별로 지금 상황과 다음에 할 일을 정리해요.',
    start: (i) => (i.picked.length ? opened('지원 현황 정리', `${i.picked.map((p) => p.over).join(', ')} 지원 현황을 정리하고 다음에 할 일을 알려 주세요`, 'applications') : null),
  },
  {
    key: 'calendar', label: '캘린더 관리', icon: 'qs-calendar', layout: 'calendar', action: (n) => CALENDAR_TASKS[n]!,
    title: '캘린더로 무엇을 할까요?', description: '지원·면접·마감·커피챗을 한곳에서 정리해요.',
    start: (i) => opened('이번 주 일정 정리', `${i.task}: 이번 주 일정 ${i.picked.length}건을 정리해 주세요`, 'calendar'),
  },
  {
    key: 'hub', label: '허브 프로필 다듬기', icon: 'qs-hub', layout: 'cards', multi: true, grid: true, action: '다듬기 시작', readsHub: true,
    title: '어떤 부분을 다듬을까요?', description: '바꾸기 전에 먼저 보여 드려요.',
    start: (i) => (i.picked.length ? opened('허브 프로필 다듬기', `허브 프로필의 ${eulReul(i.picked.map((p) => p.title).join(', '))} 다듬어 주세요`, 'hub_profile', i.documentId) : null),
  },
  {
    key: 'exp', label: '경험 만들기', icon: 'qs-experience', layout: 'cards', action: '프로젝트 기획 시작', custom: '직접 입력하기',
    title: '어떤 경험을 만들까요?', description: '갭 분석에서 부족했던 경험이에요.',
    start: (i) => {
      const topic = i.custom.trim() || one(i)?.title
      return topic ? opened(`${topic} 프로젝트`, `${topic}을 보여 줄 작은 프로젝트를 기획해 주세요`, 'experience', i.documentId) : null
    },
  },
  {
    key: 'reply', label: '제안 답장 쓰기', icon: 'qs-reply', layout: 'reply',
    title: '어떤 제안에 답장할까요?', description: '제안 내용과 내 프로필을 읽고 답장 초안을 써요.',
    start: (i) => one(i) && opened(`${one(i)!.title} 님 제안 답장`, `${one(i)!.title} 님의 제안 “${one(i)!.body}”에 보낼 답장 초안을 써 주세요`, 'offer_reply'),
  },
  {
    key: 'coffee', label: '커피챗 제안 쓰기', icon: 'qs-coffee', layout: 'pick', action: '제안 글 쓰기',
    title: '누구에게 제안할까요?', description: '상대 프로필과 내 경력을 읽고 제안 글을 써요.',
    start: (i) => one(i) && opened(`${one(i)!.title} 님께 커피챗`, `${one(i)!.title} 님에게 보낼 커피챗 제안 글을 써 주세요`, 'coffee_chat'),
  },
  {
    key: 'post', label: '커리어 글 쓰기', icon: 'qs-post', layout: 'cards', action: '초안 쓰기', custom: '직접 주제 정하기',
    title: '어떤 이야기를 쓸까요?', description: '내 활동에서 쓸 만한 주제를 골라 봤어요.',
    start: (i) => {
      const topic = i.custom.trim() || one(i)?.title
      return topic ? opened(topic, `“${topic}” 커리어 글 초안을 써 주세요`, 'career_post') : null
    },
  },
]

export const CALENDAR_TASKS = ['이번 주 정리하기', '면접·커피챗 잡기', '준비 알림 만들기'] as const

/** Board `.kw-ok:before` / `.kw-miss:before`: the glyph's right margin differs (3px / 4px). */
export const KEYWORD_GLYPH = {
  ok: { char: '✓', gap: 3 },
  // eslint-disable-next-line no-restricted-syntax -- board value; importing the theme here breaks the node tests
  miss: { char: '!', gap: 4 },
} as const

/** The page-style modal a form card (ChatPh0Input) opens in: its title is the sheet's, not the bot's question. */
