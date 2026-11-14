import { COMPOSER_PLACEHOLDER } from '../composer-placeholder'
import type { IconName } from '@push/design-system'
import type { MenuAction } from '@/shared/components/menu-action'
import type { AttachmentKind } from '@/features/bots'
import type { ChatItem, ChatState } from '../types'

const BOT_SUFFIX = /(?:봇|Bot)$/

export const botSpokenName = (name: string) => (BOT_SUFFIX.test(name) ? name : `${name} Bot`)

export const askPlaceholder = (name: string) => `${botSpokenName(name)}에게 물어보기`

/** A run that ended on its result card (ChatDone): the box invites the next ask instead of a first one. */
export const talkPlaceholder = (name: string) => `${botSpokenName(name)}에게 말하기`

const CHIP_NOUN: Record<AttachmentKind, string> = { file: '서류', document: '서류', posting: '공고', link: '링크' }

export const chipPlaceholder = (kind: AttachmentKind) => `이 ${CHIP_NOUN[kind]}로 무엇을 할까요?`

export type HeaderMenuId = 'profile' | 'find' | 'clear' | 'delete'

/** ChatBotHeaderMenu board: every item leads with an icon (SF Symbol on iOS, design icon on Android). */
export type HeaderMenuItem = { id: HeaderMenuId; label: string; destructive?: boolean; systemImage: NonNullable<MenuAction['systemImage']>; icon: IconName }

const PROFILE = { id: 'profile', label: '프로필 보기', systemImage: 'person', icon: 'user' } as const
const FIND = { id: 'find', label: '채팅에서 찾기', systemImage: 'magnifyingglass', icon: 'search' } as const
const TRASH = { systemImage: 'trash', icon: 'delete', destructive: true } as const

export const botHeaderMenu = (kind: 'push' | 'company'): HeaderMenuItem[] =>
  kind === 'push'
    ? [PROFILE, FIND, { id: 'clear', label: '대화 지우기', ...TRASH }]
    : [PROFILE, FIND, { id: 'delete', label: '삭제', ...TRASH }]

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
  body: '이 Bot과 나눈 대화와 작업 기록이 모두 지워지고 되돌릴 수 없어요. 내 서류에 저장한 파일은 그대로 남아요.',
  cancel: '취소',
  confirm: '삭제',
})

export const onboardingGreeting = (kind: 'push' | 'company', name: string, postingTitle?: string | null) => {
  if (kind === 'push') return '안녕하세요. Push Bot이에요. 공고 찾기부터 서류, 지원까지 함께 챙길게요. 무엇부터 할까요?'
  const job = postingTitle ? `${postingTitle} 공고를 기준으로 서류를 챙길게요. ` : ''
  return `안녕하세요. ${botSpokenName(name)}이에요. ${job}무엇부터 할까요?`
}

/** The first line that stays above a company bot's thread once the conversation starts (ChatBotStatus*). */
export const threadGreeting = (name: string, postingTitle?: string | null) =>
  `안녕하세요. ${botSpokenName(name)}이에요.${postingTitle ? ` 이 회사 ${postingTitle} 공고를 기준으로 서류를 챙길게요.` : ''}`

export type DraftText = { text: string }

export const withMaterial = <T extends DraftText>(drafts: Record<string, T>, id: string, text: string, blank: T): Record<string, T> => {
  const current = drafts[id] ?? blank
  return { ...drafts, [id]: { ...current, text: current.text ? `${current.text} ${text}` : text } }
}

const PLAN_OPEN = '플랜을 올리면 쓸 수 있어요.'
const PLAN_CLOSED = '지금 플랜에서는 쓸 수 없어요. 결제는 아직 준비 중이에요.'
const PLAN_BARE = '지금 플랜에서는 쓸 수 없어요.'

/** PLAN_REQUIRED line. The plan is undefined until the account loads: say the fact and offer nothing to buy. */
export const planRequired = (plan: string | undefined, paymentsOpen = true) => {
  if (plan === undefined) return PLAN_BARE
  if (!paymentsOpen) return PLAN_CLOSED
  return PLAN_OPEN
}

export const isUsageExhausted = (code?: string) => code === 'FEATURE_DISABLED' || code === 'INSUFFICIENT_CREDITS'

const failed = (i: ChatItem) => i.type === 'error' && !isUsageExhausted(i.code)

// A run counts as work once it ends on anything but a plain error (the usage card counts, as in ChatNoCredit), so one failed run in a long chat keeps the follow-up line.
const hasWork = (items: ChatItem[]) => items.some((it, n) => it.type !== 'user' && !failed(it) && (n === items.length - 1 || items[n + 1]!.type === 'user'))

const endsInResult = (items: ChatItem[]) => items.findLast((i) => i.type !== 'worked')?.type === 'result'

export const composerPlaceholder = (chat: Pick<ChatState, 'working' | 'items'>, name?: string, chipKind?: AttachmentKind) => {
  if (chipKind) return chipPlaceholder(chipKind)
  // ChatPh1/ChatPh3/ChatInterrupt: while a document flow's to-do card is on screen the box says the run takes input too; a plain turn asks the named bot (ChatBotStatusWork).
  if (chat.working && chat.items.some((i) => i.type === 'todo')) return COMPOSER_PLACEHOLDER.working
  if (name) return endsInResult(chat.items) && !chat.working ? talkPlaceholder(name) : askPlaceholder(name)
  if (chat.working) return COMPOSER_PLACEHOLDER.working
  if (hasWork(chat.items)) return COMPOSER_PLACEHOLDER.followUp
  return COMPOSER_PLACEHOLDER.first
}
