import { UPLOAD_ERROR_CODE } from '../../constants'
import type { ChatItem } from '../../types'

export type HeaderLight = 'none' | 'new' | 'limit' | 'error'

export const headerLightOf = (input: { creditsOut: boolean; unseenBotMessages: number; failed?: boolean; attention?: boolean }): HeaderLight =>
  input.creditsOut ? 'limit' : input.failed || input.attention ? 'error' : input.unseenBotMessages > 0 ? 'new' : 'none'

const failedItem = (item: ChatItem) =>
  item.type === 'error'
    ? item.code !== UPLOAD_ERROR_CODE && item.code !== 'QUEUE_BUSY'
    : item.type === 'tool'
      ? item.state === 'err' && !!item.error
      : item.type === 'notice' && item.notice.kind !== 'stopped'

export const turnFailed = (items: readonly ChatItem[]) => items.slice(items.findLastIndex((item) => item.type === 'user') + 1).some(failedItem)

export const unseenBotMessages = (items: readonly ChatItem[], seenId: string | undefined) => {
  const at = seenId === undefined ? -1 : items.findIndex((item) => item.id === seenId)
  if (seenId !== undefined && at < 0) return 0
  return items.slice(at + 1).filter((item) => item.type === 'agentText').length
}

export type CreditBanner = { lines: string[]; action: 'plan' | 'credits' | null }

export const bannerText = (banner: CreditBanner) => banner.lines.join('\n')

const monthDay = (at: Date) => `${at.getMonth() + 1}월 ${at.getDate()}일`

export const creditBanner = (input: { plan: 'FREE' | 'PRO' | 'ULTRA' | undefined; refillAt: Date | null; paymentsEnabled: boolean }): CreditBanner | null => {
  const first = '사용량을 모두 썼어요'
  if (input.plan === undefined) return { lines: [first], action: null }
  if (input.plan === 'ULTRA') return { lines: [first], action: input.paymentsEnabled ? 'credits' : null }
  const lines = input.refillAt ? [first, `${monthDay(input.refillAt)}에 채워져요`] : [first]
  return { lines, action: input.paymentsEnabled ? 'plan' : null }
}
