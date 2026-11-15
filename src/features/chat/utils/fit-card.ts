import type { ChatItem } from '../types'

type Fit = Pick<Extract<ChatItem, { type: 'fit' }>, 'plan' | 'rows' | 'summary'>

/** What each plan sees on the analysis card: FREE locks the parts, PRO and ULTRA read them. */
export const fitChrome = (item: Fit) => ({
  locked: item.plan === 'FREE' && !!item.rows?.length,
  summary: item.plan === 'FREE' ? undefined : item.summary,
})
