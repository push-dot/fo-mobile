import type { ChatItem } from '../../types'

export type HeaderLight = 'none' | 'new' | 'limit'

/** Red (the bot cannot be used) wins over green (bot messages below the fold). */
export const headerLightOf = (input: { creditsOut: boolean; unseenBotMessages: number }): HeaderLight =>
  input.creditsOut ? 'limit' : input.unseenBotMessages > 0 ? 'new' : 'none'

/** Bot lines that landed after the reader last sat at the bottom. */
export const unseenBotMessages = (items: readonly ChatItem[], seenCount: number) =>
  items.slice(seenCount).filter((item) => item.type === 'agentText').length

export type CreditBanner = { lines: string[]; action: 'plan' | 'credits' | null }

const monthDay = (at: Date) => `${at.getMonth() + 1}월 ${at.getDate()}일`

/** Under the header once the monthly allowance is spent (ChatBotHeaderLimit, ChatBotHeaderLimitUltra). */
export const creditBanner = (input: { plan: 'FREE' | 'PRO' | 'ULTRA' | undefined; refillAt: Date | null; paymentsEnabled: boolean }): CreditBanner | null => {
  if (input.plan === undefined) return null
  const first = '이번 달 사용량을 모두 썼어요.'
  if (input.plan === 'ULTRA') return { lines: [first, '크레딧을 사면 바로 이어서 쓸 수 있어요.'], action: input.paymentsEnabled ? 'credits' : null }
  const lines = input.refillAt ? [first, `${monthDay(input.refillAt)}에 다시 채워져요.`] : [first]
  return { lines, action: input.paymentsEnabled ? 'plan' : null }
}
