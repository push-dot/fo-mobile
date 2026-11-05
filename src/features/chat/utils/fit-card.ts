import { FIT_TEASER } from '../constants'
import type { ChatItem } from '../types'

type Fit = Pick<Extract<ChatItem, { type: 'fit' }>, 'plan' | 'rows' | 'summary' | 'projected'>

/** What each plan sees on the analysis card: FREE locks the parts, PRO teases ULTRA, ULTRA gets the projection. */
export const fitChrome = (item: Fit) => ({
  locked: item.plan === 'FREE' && !!item.rows?.length,
  summary: item.plan === 'FREE' ? undefined : item.summary,
  teaser: item.plan === 'PRO' ? FIT_TEASER : undefined,
  projected: item.plan === 'ULTRA' ? item.projected : undefined,
})

export const LOCKED_KEYWORDS = [
  { ok: true, width: 48 },
  { ok: true, width: 84 },
  { ok: true, width: 36 },
  { ok: false, width: 48 },
  { ok: false, width: 84 },
] as const
