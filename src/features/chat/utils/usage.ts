import { COMPOSER_PLACEHOLDER } from '../constants'
import type { ChatItem, ChatState } from '../types'

const FREE_BODY = '이번 달 사용량을 다 썼어요. 요금제를 올리거나 크레딧을 구매할 수 있어요.'
const ULTRA_BODY = '이번 달 사용량을 다 썼어요. 크레딧을 구매하면 바로 이어서 쓸 수 있어요.'
const CLOSED_BODY = '이번 달 사용량을 다 썼어요. 결제는 아직 준비 중이에요.'
const BARE_BODY = '이번 달 사용량을 다 썼어요.'

const PLAN = { id: 'plan', label: '요금제 올리기', variant: 'secondary' } as const
const CREDITS = { id: 'credits', label: '크레딧 구매', variant: 'primary' } as const

// plan is undefined until the account loads: say the fact and offer nothing to buy.
export const usageExhausted = (plan: string | undefined, paymentsOpen = true) =>
  plan === undefined ? { body: BARE_BODY, actions: [] } : !paymentsOpen ? { body: CLOSED_BODY, actions: [] } : plan === 'ULTRA' ? { body: ULTRA_BODY, actions: [CREDITS] } : { body: FREE_BODY, actions: [PLAN, CREDITS] }

const PLAN_OPEN = '요금제를 올리면 쓸 수 있어요.'
const PLAN_CLOSED = '지금 요금제에서는 쓸 수 없어요. 결제는 아직 준비 중이에요.'
const PLAN_BARE = '지금 요금제에서는 쓸 수 없어요.'

/** PLAN_REQUIRED line, in the same three states as usageExhausted. */
export const planRequired = (plan: string | undefined, paymentsOpen = true) => (plan === undefined ? PLAN_BARE : !paymentsOpen ? PLAN_CLOSED : PLAN_OPEN)

export const isUsageExhausted = (code?: string) => code === 'FEATURE_DISABLED' || code === 'INSUFFICIENT_CREDITS'

const failed = (i: ChatItem) => i.type === 'error' && !isUsageExhausted(i.code)

// A run counts as work once it ends on anything but a plain error (the usage card counts, as in ChatNoCredit), so one failed run in a long chat keeps the follow-up line.
const hasWork = (items: ChatItem[]) => items.some((it, n) => it.type !== 'user' && !failed(it) && (n === items.length - 1 || items[n + 1]!.type === 'user'))

export const composerPlaceholder = (chat: Pick<ChatState, 'working' | 'items'>) => {
  if (chat.working) return COMPOSER_PLACEHOLDER.working
  return hasWork(chat.items) ? COMPOSER_PLACEHOLDER.followUp : COMPOSER_PLACEHOLDER.first
}
