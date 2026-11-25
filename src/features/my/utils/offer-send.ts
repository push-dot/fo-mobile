import { ApiError } from '@push/api-client'
import { OFFER_BLOCKED_TITLE, OFFER_FAIL_TITLE } from './my-rules'

export type FailedSend = { key: string; body: string; blocked: boolean }

export const failedSend = (body: string, e: unknown): FailedSend => ({
  key: `${Date.now()}`,
  body,
  blocked: e instanceof ApiError && e.code === 'BLOCKED',
})

export const failedLine = (f: FailedSend) => ({
  title: f.blocked ? OFFER_BLOCKED_TITLE : OFFER_FAIL_TITLE,
  retry: !f.blocked,
})

export const composerClosed = (failed: FailedSend[], canSend?: boolean) => canSend === false || failed.some((f) => f.blocked)
