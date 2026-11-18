import type { IconName } from '@push/design-system'
import type { MenuAction } from '@/shared/components/menu-action'
import type { AttachmentKind } from '@/features/bots'
import type { ChatItem } from '../types'
import { foldBubbleCards } from './bubble-card'

const BOT_SUFFIX = /(?:봇|Bot)$/

export const botSpokenName = (name: string) => (BOT_SUFFIX.test(name) ? name : `${name} Bot`)

export const askPlaceholder = (name: string) => `${botSpokenName(name)}에게 물어보기`

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
const PLAN_BARE = '지금 플랜에서는 쓸 수 없어요.'

/** PLAN_REQUIRED line. The plan is undefined until the account loads: say the fact and offer nothing to buy. */
export const planRequired = (plan: string | undefined, paymentsOpen = true) => {
  if (plan === undefined) return PLAN_BARE
  if (!paymentsOpen) return PLAN_BARE
  return PLAN_OPEN
}

export const isUsageExhausted = (code?: string) => code === 'FEATURE_DISABLED' || code === 'INSUFFICIENT_CREDITS'

const isFailedStep = (item: Extract<ChatItem, { type: 'tool' }>) => item.state === 'err' && !!item.error

/**
 * Whether the room draws a line for this item. The tool, think and worked lines and a refused turn's error are replaced by the status
 * line and the credit banner (entries/item.tsx returns null for them). A list cell that draws nothing still takes its 18 gap,
 * so one hidden line made a 36 gap and two made 54 (ChatPh2, ChatPh3Boost, ChatPh3Review): the room never lists them.
 * The one tool line that is drawn is a failed step that says why: the red line of ChatErrors.
 */
export const isDrawn = (item: ChatItem) =>
  item.type !== 'think' && item.type !== 'worked' && !(item.type === 'tool' && !isFailedStep(item)) && !(item.type === 'error' && isUsageExhausted(item.code))

/** The running line, drawn inside the list under the last line (the boards draw it in the thread, not above the composer). */
export type RunningRow = { type: 'running'; id: 'running' }
export type ThreadRow = ChatItem | RunningRow

/**
 * The list in order, drawn lines only, and while the run works its running line under the last line (ChatBotStatusThink, Work, Long,
 * Queue, XL, DocAgentNew, and ChatPh3 where it follows the draft that is being written).
 */
export const threadRows = (items: readonly ChatItem[], working: boolean): ThreadRow[] => {
  const drawn: ThreadRow[] = foldBubbleCards(items.filter(isDrawn))
  return working ? [...drawn, { type: 'running', id: 'running' }] : drawn
}

const CHIP_NOUN: Record<AttachmentKind, string> = { document: '서류', posting: '공고', link: '링크', file: '서류' }

/** A material chip asks `이 서류로 무엇을 할까요?` (MaterialsSendHere, BotPickSent). The boards draw only the 서류 line; a file is a 서류 in the app and the other kinds follow the pattern. */
export const composerPlaceholder = (name?: string, chipKind?: AttachmentKind, androidWorking = false) =>
  chipKind ? `이 ${CHIP_NOUN[chipKind]}로 무엇을 할까요?` : androidWorking ? WORKING_PLACEHOLDER : askPlaceholder(name ?? 'Bot')

/** ChatWorking, ChatInterrupt: while a run works the Android field says it still listens; iOS keeps the name. */
const WORKING_PLACEHOLDER = '작업 중에도 말할 수 있어요'
