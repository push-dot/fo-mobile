import type { ChatItem } from '../types'

/**
 * An untitled plan right after a bot line is that line's card: the board draws the 고칠 점 rows inside the same bubble
 * (ChatPh1Feedback), so the plan leaves the list and rides on the text. A titled plan (수정 전략) stays its own card.
 */
export const foldBubbleCards = (items: readonly ChatItem[]): ChatItem[] => {
  const out: ChatItem[] = []
  for (const item of items) {
    const prev = out.at(-1)
    if (item.type === 'plan' && !item.title && prev?.type === 'agentText' && !prev.card) out[out.length - 1] = { ...prev, card: item }
    else out.push(item)
  }
  return out
}
