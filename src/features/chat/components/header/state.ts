import { UPLOAD_ERROR_CODE } from '../../constants'
import type { ChatItem } from '../../types'

export type HeaderLight = 'none' | 'new' | 'limit' | 'error'

/** Red (the bot cannot be used, the last run failed: ChatBotStatusError, or a modal waits for an answer: ChatApprove, ChatBotStatusHelp) wins over green (bot messages below the fold). */
export const headerLightOf = (input: { creditsOut: boolean; unseenBotMessages: number; failed?: boolean; attention?: boolean }): HeaderLight =>
  input.creditsOut ? 'limit' : input.failed || input.attention ? 'error' : input.unseenBotMessages > 0 ? 'new' : 'none'

const failedItem = (item: ChatItem) =>
  item.type === 'error'
    ? item.code !== UPLOAD_ERROR_CODE && item.code !== 'QUEUE_BUSY'
    : item.type === 'tool'
      ? item.state === 'err' && !!item.error
      : item.type === 'notice' && item.notice.kind !== 'stopped'

/** Something failed since the user's last line (a run, a step the run went on from, a failed check); the next message clears it. A failed upload is no run, and a busy queue (QUEUE_BUSY, ChatStates.4) refused one before it started, so neither counts. */
export const turnFailed = (items: readonly ChatItem[]) => items.slice(items.findLastIndex((item) => item.type === 'user') + 1).some(failedItem)

/** Bot lines after the newest line the reader saw at the bottom. Identity, not a count: paging older turns in at the front must not look like news. */
export const unseenBotMessages = (items: readonly ChatItem[], seenId: string | undefined) => {
  const at = seenId === undefined ? -1 : items.findIndex((item) => item.id === seenId)
  if (seenId !== undefined && at < 0) return 0
  return items.slice(at + 1).filter((item) => item.type === 'agentText').length
}

export type CreditBanner = { lines: string[]; action: 'plan' | 'credits' | null }

/** One sentence per line, as the boards draw it: a date never breaks inside a sentence that wraps (rule 5; ChatBotHeaderLimit breaks after 썼어요.). */
export const bannerText = (banner: CreditBanner) => banner.lines.join('\n')

const monthDay = (at: Date) => `${at.getMonth() + 1}월 ${at.getDate()}일`

/** Under the header once the monthly allowance is spent (ChatBotHeaderLimit, ChatBotHeaderLimitUltra). */
export const creditBanner = (input: { plan: 'FREE' | 'PRO' | 'ULTRA' | undefined; refillAt: Date | null; paymentsEnabled: boolean }): CreditBanner | null => {
  const first = '사용량을 모두 썼어요'
  if (input.plan === undefined) return { lines: [first], action: null }
  if (input.plan === 'ULTRA') return { lines: [first], action: input.paymentsEnabled ? 'credits' : null }
  const lines = input.refillAt ? [first, `${monthDay(input.refillAt)}에 채워져요`] : [first]
  return { lines, action: input.paymentsEnabled ? 'plan' : null }
}
