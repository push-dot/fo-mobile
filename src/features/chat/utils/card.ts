import { AWAITING_TEXT } from '../constants'
import type { Approval } from '../types'
import type { LiveLine } from './status-line'

/** The page-read card is the one with 항상 허용 (server SITE_OPTIONS). Its title is the question and its summary the line under it. */
export const isSiteCard = (optionIds: readonly string[]) => optionIds.includes('approve_always')

/** The waiting line under the thread while a card is open. A card waits until it is answered (rule 29). */
export const waitingLine = (card: Approval | null): Extract<LiveLine, { kind: 'waiting' }> | null => {
  if (!card || card.openedAt === undefined) return null
  const confirm = !!card.confirm || card.waitText !== undefined
  return {
    kind: 'waiting',
    since: new Date(card.openedAt),
    for: confirm ? 'confirm' : 'answer',
    cardId: card.id,
    text: card.waitText ?? (confirm ? AWAITING_TEXT.approval : AWAITING_TEXT.choice),
    ...(card.waitText === undefined ? {} : { named: true as const }),
  }
}
