import { useState } from 'react'
import type { ChatItem } from '../../types'
import { unseenBotMessages } from './state'

/** Bot lines that landed while the reader was scrolled up. Sitting at the bottom marks everything seen. */
export const useUnseen = (items: readonly ChatItem[], atBottom: boolean) => {
  const [seen, setSeen] = useState(items.length)
  if (atBottom && seen !== items.length) setSeen(items.length)
  return atBottom ? 0 : unseenBotMessages(items, seen)
}
