import type { ChatItem } from '../types'

/**
 * A plan right after a bot line is that line's table: the bubble draws the rows under the text (ChatPh1Feedback, ChatPh2),
 * so the plan leaves the list and rides on the text.
 */
export const foldBubbleCards = (items: readonly ChatItem[]): ChatItem[] => {
  const out: ChatItem[] = []
  for (const item of items) {
    const prev = out.at(-1)
    if (item.type === 'plan' && prev?.type === 'agentText' && !prev.card) out[out.length - 1] = { ...prev, card: item }
    else out.push(item)
  }
  return out
}
