import { ApiError } from '@push/api-client'
import { OFFER_BLOCKED_TITLE, OFFER_FAIL_TITLE } from './my-rules'

export type FailedSend = { key: string; body: string; blocked: boolean }

/** BLOCKED (403): the other person blocked the viewer, so retrying can never work. */
export const failedSend = (body: string, e: unknown): FailedSend => ({
  key: `${Date.now()}`,
  body,
  blocked: e instanceof ApiError && e.code === 'BLOCKED',
})

/** What the failed bubble says and whether it keeps the retry icon. */
export const failedLine = (f: FailedSend) => ({
  title: f.blocked ? OFFER_BLOCKED_TITLE : OFFER_FAIL_TITLE,
  retry: !f.blocked,
})

/** Once any send was rejected as BLOCKED the composer is replaced by a note. */
export const composerClosed = (failed: FailedSend[]) => failed.some((f) => f.blocked)
