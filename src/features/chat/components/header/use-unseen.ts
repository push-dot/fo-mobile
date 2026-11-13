import { useState } from 'react'
import type { ChatItem } from '../../types'
import { unseenBotMessages } from './state'

/** Bot lines that landed while the reader was scrolled up. Sitting at the bottom marks everything seen. */
export const useUnseen = (items: readonly ChatItem[], atBottom: boolean) => {
  const newest = items[items.length - 1]?.id
  const [seenId, setSeenId] = useState(newest)
  if (atBottom && seenId !== newest) setSeenId(newest)
  return atBottom ? 0 : unseenBotMessages(items, seenId)
}
