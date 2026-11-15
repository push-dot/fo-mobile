import type { ChatItem } from '../types'

/**
 * A plan right after a bot line is that line's table, and a diff its "바뀐 곳 보기": the bubble draws them under the text
 * (ChatPh1Feedback, ChatPh2, ChatPh3Review), so they leave the list and ride on the text.
 */
export const foldBubbleCards = (items: readonly ChatItem[]): ChatItem[] => {
  const out: ChatItem[] = []
  for (const item of items) {
    const prev = out.at(-1)
    if (item.type === 'plan' && prev?.type === 'agentText' && !prev.card) out[out.length - 1] = { ...prev, card: item }
    else if (item.type === 'diff' && prev?.type === 'agentText' && !prev.diff) out[out.length - 1] = { ...prev, diff: item }
    else out.push(item)
  }
  return out
}
