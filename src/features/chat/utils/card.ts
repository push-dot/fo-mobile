import { AWAITING_TEXT } from '../constants'
import type { Approval } from '../types'
import type { LiveLine } from './status-line'

export type CardState = 'open' | 'expired'

type Times = Pick<Approval, 'openedAt' | 'expiresAt'>

/** Pure and derived from the clock, so nothing has to fire when a card expires. */
export const cardState = (card: Pick<Approval, 'expiresAt'>, now: number): CardState =>
  card.expiresAt !== undefined && card.expiresAt <= now ? 'expired' : 'open'

/** The page-read card is the one with 항상 허용 (server SITE_OPTIONS). Its title is the question and its summary the line under it. */
export const isSiteCard = (optionIds: readonly string[]) => optionIds.includes('approve_always')

const MINUTE = 60_000

/**
 * "10분", "24시간". Rounded, never floored: a live approval event has no openedAt, so the app reads it from the
 * stream stamp or the waiting status, which come a few ms after the stored created_at, and 10분 would read "9분".
 */
export const lifetimeLabel = (ms: number) => {
  const minutes = Math.max(1, Math.round(ms / MINUTE))
  return minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60}시간` : `${minutes}분`
}

/** The server moves openedAt and expiresAt together on a retry, so the span, and this sentence, survive any number of them. */
export const expiredNote = ({ openedAt, expiresAt }: Times) =>
  openedAt !== undefined && expiresAt !== undefined
    ? `${lifetimeLabel(expiresAt - openedAt)} 동안 답이 없어서 작업을 멈췄어요. 다시 요청하면 이어서 해요.`
    : '답이 없어서 작업을 멈췄어요. 다시 요청하면 이어서 해요.'

/** The waiting line under the thread while a card is open. An expired card has none (ChatBotStatusExpired). */
export const waitingLine = (card: Approval | null, state: CardState): Extract<LiveLine, { kind: 'waiting' }> | null => {
  if (!card || card.openedAt === undefined || state === 'expired') return null
  const confirm = !!card.confirm
  return {
    kind: 'waiting',
    since: new Date(card.openedAt),
    for: confirm ? 'confirm' : 'answer',
    cardId: card.id,
    text: confirm ? AWAITING_TEXT.approval : AWAITING_TEXT.choice,
  }
}
