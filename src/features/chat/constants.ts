import type { AccessMode, ChatIntent } from '@push/api-client'
import type { Icon3DName } from '@/shared/components'
import type { QsItem } from './api/schemas'
import { planRequired } from './utils/usage'


export const BUBBLE = [0.2, 0.9, 0.25, 1.15] as const

export const DEFAULT_ACCESS_MODE: AccessMode = 'AUTO'

export const ACCESS_TITLE = 'Bot이 어떻게 실행할까요?'

export const ACCESS_MODES: readonly { key: AccessMode; label: string }[] = [
  { key: 'ALWAYS_ASK', label: '항상 묻기' },
  { key: 'AUTO', label: '자동' },
  { key: 'BYPASS', label: '바로 실행' },
]

export const MICRO_CREDITS_PER_CREDIT = 6000


export const STOPPING_TEXT = '중지하는 중'

export const AWAITING_TEXT = { approval: '확인을 기다리고 있어요', choice: '답을 기다리고 있어요' } as const

export const queueBusyText = (sec: number) => `지금 요청이 많아요. ${sec}초 뒤에 다시 보내 주세요.`
export const billingLockedText = (sec: number) => `결제 정보를 정리하고 있어요. ${sec}초 뒤에 다시 보내 주세요.`
export const queueBusyMessage = (retryAfterSec?: number, reason?: unknown) => {
  if (retryAfterSec && reason === 'BILLING_LOCKED') return billingLockedText(retryAfterSec)
  if (retryAfterSec) return queueBusyText(retryAfterSec)
  return ERROR_TEXT.QUEUE_BUSY
}
export const TRY_LATER = '잠시 뒤에 다시 해 주세요.'
export const DISCONNECT_REASON = '연결이 끊겼어요'
export const DEFAULT_ERROR_TEXT = '작업을 이어가지 못했어요. 다시 보내 주세요.'
export const GATED_STEP = -1

export const UPLOAD_ERROR_CODE = 'UPLOAD_FAILED'
export const UPLOAD_ERROR_TEXT = '파일을 올리지 못했어요. 네트워크를 확인하고 다시 올려 주세요.'
export const CHAT_STOP_FORBIDDEN = '다른 담당자가 시작한 작업이라 멈출 수 없어요'
export const CHAT_STOP_FAILED = '멈추지 못했어요. 한 번 더 눌러 주세요'

export const CONSENT_TITLE = 'Bot을 쓰려면 동의가 필요해요'
export const CONSENT_BODY = '내 서류를 다른 Bot이 참고 자료로 써요.'
export const PLAN_HEADER = '플랜마다\n쓸 수 있는 양이 달라요'
export const ACCOUNT_REFERENCE_TITLE = 'Bot이 참고하는 내 정보'
export const USAGE_TITLE = '사용량'
export const USAGE_BY_BOT_TITLE = 'Bot별'
export const ACCOUNT_REFERENCE_NOTE = '대화를 시작할 때 Bot이 이 정보부터 읽어요.'
export const docAiSub = (ago: string) => `Bot으로 만듦 · ${ago}`
export const linkMentionSub = (kindLabel: string, url: string) => `${kindLabel} · ${url.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
export const FILE_SHARE_FAILED = '파일을 공유하지 못했어요. 잠시 뒤에 다시 해 주세요.'
export const FILE_SHARE_NOT_FINALIZED = '아직 마무리되지 않은 서류라 공유할 수 없어요.'
export const PROFILE_SAVED = '프로필을 고쳤어요.'
export const CONSENT_AGREE = '동의하고 시작하기'
export const DEFAULT_DOC = '허브 프로필'
const eulReul = (name = '') => `${name}${/[가-힣]$/.test(name) && (name.charCodeAt(name.length - 1) - 0xac00) % 28 !== 0 ? '을' : '를'}`
export const CHAT_DOCS_KEY = ['me', 'sources', 'chat-docs'] as const

export const CHAT_ATTACHMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]
export const CHAT_ATTACHMENT_OPTIONS = { type: CHAT_ATTACHMENT_TYPES, copyToCacheDirectory: true }
export const CHAT_ATTACHMENT_OPTIONS_ANDROID = { type: [...CHAT_ATTACHMENT_TYPES, 'text/*', 'application/octet-stream'], copyToCacheDirectory: true }
export const isChatAttachment = (name: string) => /\.(pdf|docx|txt|md)$/i.test(name)

export type QsLayout = 'link' | 'match' | 'pick' | 'status' | 'calendar' | 'cards' | 'reply'

export type QsInput = { picked: QsItem[]; url: string; chips: string[]; option: boolean; doc?: string; documentId?: string; task: string; custom: string }

export const COMPOSE = { top: 16, header: 44, side: 20, bottom: 8 }
export const ALL_DESCRIPTION_TOP = 6
export const ALL_FIELD_HEIGHT = 52

export type QuickStart = {
  key: string
  label: string
  icon: Icon3DName
  title: string
  description: string
  layout: QsLayout
  action?: string | ((n: number) => string)
  multi?: boolean
  grid?: boolean
  docLabel?: string
  readsHub?: boolean
  listLabel?: string
  openList?: boolean
  custom?: string
  customHeight?: number
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
    key: 'gap', label: '부족한 점 찾기', icon: 'qs-gap', layout: 'pick', action: '부족한 점 찾기', listLabel: '공고', openList: true, readsHub: true,
    title: '어떤 공고와 비교할까요?', description: '공고 요건과 내 서류를 비교해요.',
    start: (i) => one(i) && opened(`${one(i)!.over} 부족한 점`, `${one(i)!.over} ${one(i)!.title} 공고 요건에 비해 내 프로필에서 부족한 점을 알려 주세요`, 'gaps', i.documentId),
  },
  {
    key: 'fit', label: '적합도 보기', icon: 'qs-fit', layout: 'pick', action: '적합도 보기', listLabel: '공고', openList: true, readsHub: true,
    title: '어떤 공고와 비교할까요?', description: '적합도를 보고, 이어서 점수를 올려요.',
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
    start: (i) => {
      const [title, ask] = calendarAsk(i.task, i.picked.length)
      return opened(title, `${i.task}: ${ask}`, 'calendar')
    },
  },
  {
    key: 'hub', label: '허브 프로필 다듬기', icon: 'qs-hub', layout: 'cards', multi: true, grid: true, action: '다듬기 시작', readsHub: true,
    title: '어떤 부분을 다듬을까요?', description: '바꾸기 전에 먼저 보여 드려요.',
    start: (i) => (i.picked.length ? opened('허브 프로필 다듬기', `허브 프로필의 ${eulReul(i.picked.map((p) => p.title).join(', '))} 다듬어 주세요`, 'hub_profile', i.documentId) : null),
  },
  {
    key: 'exp', label: '경험 만들기', icon: 'qs-experience', layout: 'cards', action: '프로젝트 기획 시작', custom: '직접 입력하기', customHeight: 54,
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

export const CALENDAR_TASKS = ['이번 주 정리하기', '마감일 넣기', '면접·커피챗 잡기', '준비 알림 만들기'] as const

const calendarAsk = (task: string, events: number): [string, string] => {
  if (task === '마감일 넣기') return ['마감일 넣기', '북마크한 공고의 마감일을 캘린더에 넣어 주세요']
  if (task === '면접·커피챗 잡기') return ['면접·커피챗 잡기', '면접과 커피챗 일정을 캘린더에 잡아 주세요']
  if (task === '준비 알림 만들기') return ['준비 알림 만들기', '다가오는 일정마다 준비할 일을 알림으로 만들어 주세요']
  return ['이번 주 일정 정리', events ? `이번 주 일정 ${events}건을 정리해 주세요` : '이번 주 일정을 정리해 주세요']
}


export const READ_OFF_CODE = 'FILES_READ_OFF'
export const READ_OFF_TEXT = '내 자료 읽기가 꺼져 있어서 마이 › 서류와 북마크 공고를 읽을 수 없어요. 서류를 직접 첨부하거나, 설정에서 내 자료 읽기를 켜 주세요.'
export const READ_OFF_ATTACH = '서류 첨부'
export const READ_OFF_SETTINGS = '설정 열기'

export const applyText = (company?: string) => (company ? `${company}에 바로 지원해 줘` : '바로 지원해 줘')
export const SAVE_RETRY_TEXT = '내 서류에 저장해 줘'

export const UNDO_LABEL = '되돌리기'

const USAGE_BODY = '이번 달 사용량을 모두 썼어요.'

export const ERROR_TEXT: Record<string, string> = {
  FEATURE_DISABLED: USAGE_BODY,
  INSUFFICIENT_CREDITS: USAGE_BODY,
  PLAN_REQUIRED: planRequired('FREE'),
  [READ_OFF_CODE]: READ_OFF_TEXT,
  QUEUE_BUSY: '지금 요청이 많아요. 잠시 뒤에 다시 보내 주세요.',
  APPROVAL_ALREADY_RESOLVED: '이미 답한 요청이에요.',
  APPROVAL_EXPIRED: '시간이 지나서 답할 수 없어요. 다시 보내 주세요.',
  NOT_CONFIGURED: '지금은 Bot을 쓸 수 없어요. 잠시 뒤에 다시 해 주세요.',
}
