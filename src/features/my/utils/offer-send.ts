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

/** The composer is replaced by a note when push-be says the offer takes no messages (canSend false) or a send came back BLOCKED. */
export const composerClosed = (failed: FailedSend[], canSend?: boolean) => canSend === false || failed.some((f) => f.blocked)
