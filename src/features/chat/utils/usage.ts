import { COMPOSER_PLACEHOLDER } from '../composer-placeholder'
import type { ChatItem, ChatState } from '../types'

const BOT_SUFFIX = /(?:봇|Bot)$/

export const botSpokenName = (name: string) => (BOT_SUFFIX.test(name) ? name : `${name} 봇`)

export const askPlaceholder = (name: string) => `${botSpokenName(name)}에게 물어보기`

export type HeaderMenuId = 'profile' | 'find' | 'clear' | 'delete'

export type HeaderMenuItem = { id: HeaderMenuId; label: string; destructive?: boolean }

const PROFILE = { id: 'profile', label: '프로필 보기' } as const
const FIND = { id: 'find', label: '채팅에서 찾기' } as const

export const botHeaderMenu = (kind: 'push' | 'company'): HeaderMenuItem[] =>
  kind === 'push'
    ? [PROFILE, FIND, { id: 'clear', label: '대화 지우기', destructive: true }]
    : [PROFILE, FIND, { id: 'delete', label: '삭제', destructive: true }]

export const headerAction = (id: HeaderMenuId, kind: 'push' | 'company') => {
  if (id === 'clear') return kind === 'push' ? 'confirm-clear' : 'noop'
  if (id === 'delete') return kind === 'company' ? 'confirm-delete' : 'noop'
  return id
}

export const clearChatConfirm = () => ({
  title: 'Push Bot과 나눈 대화를 지울까요?',
  body: '대화 내용이 모두 지워지고 되돌릴 수 없어요. 내 서류에 저장한 파일과 자료는 그대로 남아요.',
  cancel: '취소',
  confirm: '지우기',
})

export const deleteBotConfirm = (name: string) => ({
  title: `${botSpokenName(name)}을 삭제할까요?`,
  body: '이 봇과 나눈 대화와 작업 기록이 모두 지워지고 되돌릴 수 없어요. 내 서류에 저장한 파일은 그대로 남아요.',
  cancel: '취소',
  confirm: '삭제',
})

export const onboardingGreeting = (kind: 'push' | 'company', name: string, postingTitle?: string | null) => {
  if (kind === 'push') return '안녕하세요. Push Bot이에요. 공고 찾기부터 서류, 지원까지 함께 챙길게요. 무엇부터 할까요?'
  const job = postingTitle ? `${postingTitle} 공고를 기준으로 서류를 챙길게요. ` : ''
  return `안녕하세요. ${botSpokenName(name)}이에요. ${job}무엇부터 할까요?`
}

export type DraftText = { text: string }

export const withMaterial = <T extends DraftText>(drafts: Record<string, T>, id: string, text: string, blank: T): Record<string, T> => {
  const current = drafts[id] ?? blank
  return { ...drafts, [id]: { ...current, text: current.text ? `${current.text} ${text}` : text } }
}

const FREE_BODY = '이번 달 사용량을 다 썼어요. 요금제를 올리거나 크레딧을 구매할 수 있어요.'
const ULTRA_BODY = '이번 달 사용량을 다 썼어요. 크레딧을 구매하면 바로 이어서 쓸 수 있어요.'
const CLOSED_BODY = '이번 달 사용량을 다 썼어요. 결제는 아직 준비 중이에요.'
const BARE_BODY = '이번 달 사용량을 다 썼어요.'

const PLAN = { id: 'plan', label: '요금제 올리기', variant: 'secondary' } as const
const CREDITS = { id: 'credits', label: '크레딧 구매', variant: 'primary' } as const

// plan is undefined until the account loads: say the fact and offer nothing to buy.
export const usageExhausted = (plan: string | undefined, paymentsOpen = true) => {
  if (plan === undefined) return { body: BARE_BODY, actions: [] }
  if (!paymentsOpen) return { body: CLOSED_BODY, actions: [] }
  if (plan === 'ULTRA') return { body: ULTRA_BODY, actions: [CREDITS] }
  return { body: FREE_BODY, actions: [PLAN, CREDITS] }
}

const PLAN_OPEN = '요금제를 올리면 쓸 수 있어요.'
const PLAN_CLOSED = '지금 요금제에서는 쓸 수 없어요. 결제는 아직 준비 중이에요.'
const PLAN_BARE = '지금 요금제에서는 쓸 수 없어요.'

/** PLAN_REQUIRED line, in the same three states as usageExhausted. */
export const planRequired = (plan: string | undefined, paymentsOpen = true) => {
  if (plan === undefined) return PLAN_BARE
  if (!paymentsOpen) return PLAN_CLOSED
  return PLAN_OPEN
}

export const isUsageExhausted = (code?: string) => code === 'FEATURE_DISABLED' || code === 'INSUFFICIENT_CREDITS'

const failed = (i: ChatItem) => i.type === 'error' && !isUsageExhausted(i.code)

// A run counts as work once it ends on anything but a plain error (the usage card counts, as in ChatNoCredit), so one failed run in a long chat keeps the follow-up line.
const hasWork = (items: ChatItem[]) => items.some((it, n) => it.type !== 'user' && !failed(it) && (n === items.length - 1 || items[n + 1]!.type === 'user'))

export const composerPlaceholder = (chat: Pick<ChatState, 'working' | 'items'>, name?: string) => {
  if (chat.working) return COMPOSER_PLACEHOLDER.working
  if (hasWork(chat.items)) return COMPOSER_PLACEHOLDER.followUp
  return name ? askPlaceholder(name) : COMPOSER_PLACEHOLDER.first
}
