import type { ChatItem } from '../types'

/**
 * A plan right after a bot line is that line's table, a diff its "바뀐 내용 보기" and the result card the closing line's link
 * (ChatPh1Feedback, ChatPh2, ChatPh6Result): the bubble draws them under the text, so they leave the list and ride on the text.
 * A result still waiting on a profile-save note stays its own card.
 */
export const foldBubbleCards = (items: readonly ChatItem[]): ChatItem[] => {
  const out: ChatItem[] = []
  for (const item of items) {
    const prev = out.at(-1)
    if (item.type === 'plan' && prev?.type === 'agentText' && !prev.card) out[out.length - 1] = { ...prev, card: item }
    else if (item.type === 'diff' && prev?.type === 'agentText' && !prev.diff) out[out.length - 1] = { ...prev, diff: item }
    else if (item.type === 'result' && !(item.source === 'profile' && item.pendingNote) && prev?.type === 'agentText' && prev.id.startsWith('done-') && !prev.result) out[out.length - 1] = { ...prev, result: item }
    else out.push(item)
  }
  return out
}
